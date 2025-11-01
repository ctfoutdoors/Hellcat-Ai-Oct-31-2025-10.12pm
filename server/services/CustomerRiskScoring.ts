import { getDb } from "../db";
import { customerRiskScores, InsertCustomerRiskScore } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ReamazeService } from "./ReamazeService";
import { KlaviyoService } from "./KlaviyoService";

/**
 * AI-Powered Customer Risk Scoring System
 * 
 * Calculates comprehensive risk scores based on:
 * - Dispute history
 * - Support ticket patterns
 * - Review sentiment
 * - Order frequency
 * - Email engagement
 */

interface RiskFactors {
  disputeHistory: {
    totalDisputes: number;
    disputeRate: number; // disputes / orders
    recentDisputes: number; // last 90 days
    score: number; // 0-100
  };
  supportTickets: {
    totalTickets: number;
    openTickets: number;
    averageResolutionTime: number;
    satisfactionScore: number;
    score: number; // 0-100
  };
  reviewSentiment: {
    averageRating: number;
    totalReviews: number;
    recentNegativeReviews: number;
    score: number; // 0-100
  };
  orderFrequency: {
    totalOrders: number;
    orderFrequency: string; // "high", "medium", "low"
    lifetimeValue: number;
    score: number; // 0-100
  };
  engagement: {
    emailOpenRate: number;
    emailClickRate: number;
    lastPurchaseDate: Date | null;
    score: number; // 0-100
  };
}

interface RiskScore {
  overallScore: number; // 0-100 (0 = no risk, 100 = high risk)
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: RiskFactors;
  recommendations: string[];
  confidence: number; // 0-100
}

export class CustomerRiskScoring {
  /**
   * Calculate comprehensive risk score for a customer
   */
  static async calculateRiskScore(
    customerIdentityId: number,
    customerEmail: string
  ): Promise<RiskScore> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Gather data from all sources
    const [disputeData, supportData, engagementData] = await Promise.all([
      this.getDisputeHistory(customerIdentityId),
      ReamazeService.getCachedTickets(customerEmail),
      KlaviyoService.getCachedProfile(customerEmail),
    ]);

    // Calculate individual factor scores
    const factors: RiskFactors = {
      disputeHistory: this.scoreDisputeHistory(disputeData),
      supportTickets: this.scoreSupportTickets(supportData.stats),
      reviewSentiment: this.scoreReviewSentiment(engagementData.stats),
      orderFrequency: this.scoreOrderFrequency(engagementData.stats),
      engagement: this.scoreEngagement(engagementData.stats, engagementData.profile),
    };

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore(factors);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, riskLevel);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(factors);

    const riskScore: RiskScore = {
      overallScore,
      riskLevel,
      factors,
      recommendations,
      confidence,
    };

    // Store in database
    await this.storeRiskScore(customerIdentityId, riskScore);

    return riskScore;
  }

  /**
   * Get dispute history for customer
   */
  private static async getDisputeHistory(customerIdentityId: number): Promise<{
    totalDisputes: number;
    totalOrders: number;
    recentDisputes: number;
  }> {
    const db = await getDb();
    if (!db) return { totalDisputes: 0, totalOrders: 0, recentDisputes: 0 };

    // Get customer identity
    const { customerIdentities } = await import("../../drizzle/schema");
    const [identity] = await db
      .select()
      .from(customerIdentities)
      .where(eq(customerIdentities.id, customerIdentityId));

    if (!identity) {
      return { totalDisputes: 0, totalOrders: 0, recentDisputes: 0 };
    }

    // Get recent disputes (last 90 days)
    const { cases } = await import("../../drizzle/schema");
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentCases = await db
      .select()
      .from(cases)
      .where(eq(cases.customerEmail, identity.email || ""));

    const recentDisputes = recentCases.filter(
      c => new Date(c.createdAt) >= ninetyDaysAgo
    ).length;

    return {
      totalDisputes: identity.disputeCount,
      totalOrders: identity.totalOrders,
      recentDisputes,
    };
  }

  /**
   * Score dispute history (0-100, higher = more risk)
   */
  private static scoreDisputeHistory(data: {
    totalDisputes: number;
    totalOrders: number;
    recentDisputes: number;
  }): RiskFactors["disputeHistory"] {
    let score = 0;

    // Calculate dispute rate
    const disputeRate = data.totalOrders > 0 ? data.totalDisputes / data.totalOrders : 0;

    // High dispute rate = high risk
    if (disputeRate > 0.2) score += 40; // >20% dispute rate
    else if (disputeRate > 0.1) score += 25; // >10% dispute rate
    else if (disputeRate > 0.05) score += 15; // >5% dispute rate

    // Recent disputes = higher risk
    if (data.recentDisputes > 3) score += 30;
    else if (data.recentDisputes > 1) score += 15;

    // Total disputes
    if (data.totalDisputes > 10) score += 20;
    else if (data.totalDisputes > 5) score += 10;

    return {
      totalDisputes: data.totalDisputes,
      disputeRate,
      recentDisputes: data.recentDisputes,
      score: Math.min(100, score),
    };
  }

  /**
   * Score support tickets (0-100, higher = more risk)
   */
  private static scoreSupportTickets(stats: {
    totalTickets: number;
    openTickets: number;
    averageResolutionTimeHours: number;
    averageSatisfactionScore: number;
  }): RiskFactors["supportTickets"] {
    const score = ReamazeService.calculateSupportRiskScore(stats);

    return {
      totalTickets: stats.totalTickets,
      openTickets: stats.openTickets,
      averageResolutionTime: stats.averageResolutionTimeHours,
      satisfactionScore: stats.averageSatisfactionScore,
      score,
    };
  }

  /**
   * Score review sentiment (0-100, higher = more risk)
   */
  private static scoreReviewSentiment(stats: {
    averageReviewRating: number;
    totalReviews: number;
  }): RiskFactors["reviewSentiment"] {
    let score = 0;

    const avgRating = stats.averageReviewRating / 100; // Convert from basis points

    if (avgRating > 0) {
      if (avgRating < 2.5) score += 40;
      else if (avgRating < 3.5) score += 25;
      else if (avgRating < 4.0) score += 10;
    }

    // Few reviews = less confidence, slight risk
    if (stats.totalReviews < 3 && stats.totalReviews > 0) score += 5;

    return {
      averageRating: avgRating,
      totalReviews: stats.totalReviews,
      recentNegativeReviews: 0, // TODO: Calculate from review data
      score: Math.min(100, score),
    };
  }

  /**
   * Score order frequency (0-100, higher = more risk)
   */
  private static scoreOrderFrequency(stats: {
    totalOrders: number;
    lifetimeValue: number;
  }): RiskFactors["orderFrequency"] {
    let score = 0;
    let frequency: "high" | "medium" | "low" = "medium";

    // Low order count = higher risk (new customer)
    if (stats.totalOrders < 3) {
      score += 25;
      frequency = "low";
    } else if (stats.totalOrders < 10) {
      score += 10;
      frequency = "medium";
    } else {
      frequency = "high";
    }

    // Low LTV = higher risk
    const ltv = stats.lifetimeValue / 100; // Convert from cents
    if (ltv < 100 && stats.totalOrders > 0) score += 15;
    else if (ltv < 500 && stats.totalOrders > 0) score += 5;

    return {
      totalOrders: stats.totalOrders,
      orderFrequency: frequency,
      lifetimeValue: ltv,
      score: Math.min(100, score),
    };
  }

  /**
   * Score engagement (0-100, higher = more risk)
   */
  private static scoreEngagement(
    stats: {
      emailOpenRate: number;
      emailClickRate: number;
    },
    profile: any
  ): RiskFactors["engagement"] {
    const score = KlaviyoService.calculateEngagementRiskScore({
      emailOpenRate: stats.emailOpenRate,
      emailClickRate: stats.emailClickRate,
      totalOrders: 0, // Already scored in orderFrequency
      averageReviewRating: 0, // Already scored in reviewSentiment
    });

    return {
      emailOpenRate: stats.emailOpenRate / 100, // Convert from basis points
      emailClickRate: stats.emailClickRate / 100,
      lastPurchaseDate: profile?.lastPurchaseAt || null,
      score,
    };
  }

  /**
   * Calculate weighted overall score
   */
  private static calculateWeightedScore(factors: RiskFactors): number {
    const weights = {
      disputeHistory: 0.35, // 35% weight - most important
      supportTickets: 0.25, // 25% weight
      reviewSentiment: 0.20, // 20% weight
      orderFrequency: 0.10, // 10% weight
      engagement: 0.10, // 10% weight
    };

    const weightedScore =
      factors.disputeHistory.score * weights.disputeHistory +
      factors.supportTickets.score * weights.supportTickets +
      factors.reviewSentiment.score * weights.reviewSentiment +
      factors.orderFrequency.score * weights.orderFrequency +
      factors.engagement.score * weights.engagement;

    return Math.round(weightedScore);
  }

  /**
   * Determine risk level from score
   */
  private static determineRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 75) return "critical";
    if (score >= 50) return "high";
    if (score >= 25) return "medium";
    return "low";
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    factors: RiskFactors,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    // Dispute-based recommendations
    if (factors.disputeHistory.score > 30) {
      recommendations.push("⚠️ High dispute rate - Review case carefully and gather strong evidence");
      if (factors.disputeHistory.recentDisputes > 2) {
        recommendations.push("🚨 Multiple recent disputes - Consider flagging for manual review");
      }
    }

    // Support ticket recommendations
    if (factors.supportTickets.score > 30) {
      recommendations.push("📞 High support activity - Review ticket history for context");
      if (factors.supportTickets.openTickets > 2) {
        recommendations.push("⏳ Multiple open tickets - Customer may be experiencing ongoing issues");
      }
    }

    // Review sentiment recommendations
    if (factors.reviewSentiment.score > 25) {
      recommendations.push("⭐ Low review ratings - Customer satisfaction concerns noted");
    }

    // Order frequency recommendations
    if (factors.orderFrequency.score > 20) {
      recommendations.push("🆕 New or infrequent customer - Exercise caution with claim approval");
    }

    // Engagement recommendations
    if (factors.engagement.score > 20) {
      recommendations.push("📧 Low email engagement - Customer may be disengaged");
    }

    // Overall recommendations
    if (riskLevel === "critical") {
      recommendations.push("🛑 CRITICAL RISK - Require manager approval before proceeding");
    } else if (riskLevel === "high") {
      recommendations.push("⚠️ HIGH RISK - Request additional documentation and verification");
    } else if (riskLevel === "low") {
      recommendations.push("✅ LOW RISK - Standard processing recommended");
    }

    return recommendations;
  }

  /**
   * Calculate confidence score based on data availability
   */
  private static calculateConfidence(factors: RiskFactors): number {
    let confidence = 0;
    let dataPoints = 0;

    // Check each factor for data availability
    if (factors.disputeHistory.totalOrders > 0) {
      confidence += 30;
      dataPoints++;
    }

    if (factors.supportTickets.totalTickets > 0) {
      confidence += 25;
      dataPoints++;
    }

    if (factors.reviewSentiment.totalReviews > 0) {
      confidence += 20;
      dataPoints++;
    }

    if (factors.orderFrequency.totalOrders > 0) {
      confidence += 15;
      dataPoints++;
    }

    if (factors.engagement.emailOpenRate > 0) {
      confidence += 10;
      dataPoints++;
    }

    // Adjust confidence based on number of data points
    if (dataPoints < 2) confidence = Math.min(confidence, 40);

    return Math.min(100, confidence);
  }

  /**
   * Store risk score in database
   */
  private static async storeRiskScore(
    customerIdentityId: number,
    riskScore: RiskScore
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const scoreData: InsertCustomerRiskScore = {
      customerIdentityId,
      riskScore: riskScore.overallScore,
      riskLevel: riskScore.riskLevel,
      disputeHistoryScore: riskScore.factors.disputeHistory.score,
      supportTicketScore: riskScore.factors.supportTickets.score,
      reviewSentimentScore: riskScore.factors.reviewSentiment.score,
      orderFrequencyScore: riskScore.factors.orderFrequency.score,
      engagementScore: riskScore.factors.engagement.score,
      scoreBreakdown: JSON.stringify(riskScore.factors),
      recommendations: JSON.stringify(riskScore.recommendations),
      calculatedAt: new Date(),
    };

    await db
      .insert(customerRiskScores)
      .values(scoreData)
      .onDuplicateKeyUpdate({
        set: {
          riskScore: scoreData.riskScore,
          riskLevel: scoreData.riskLevel,
          disputeHistoryScore: scoreData.disputeHistoryScore,
          supportTicketScore: scoreData.supportTicketScore,
          reviewSentimentScore: scoreData.reviewSentimentScore,
          orderFrequencyScore: scoreData.orderFrequencyScore,
          engagementScore: scoreData.engagementScore,
          scoreBreakdown: scoreData.scoreBreakdown,
          recommendations: scoreData.recommendations,
          calculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get cached risk score
   */
  static async getCachedRiskScore(customerIdentityId: number): Promise<RiskScore | null> {
    const db = await getDb();
    if (!db) return null;

    const [score] = await db
      .select()
      .from(customerRiskScores)
      .where(eq(customerRiskScores.customerIdentityId, customerIdentityId));

    if (!score) return null;

    return {
      overallScore: score.riskScore,
      riskLevel: score.riskLevel,
      factors: score.scoreBreakdown ? JSON.parse(score.scoreBreakdown) : {},
      recommendations: score.recommendations ? JSON.parse(score.recommendations) : [],
      confidence: 100, // Cached scores are fully calculated
    };
  }
}
