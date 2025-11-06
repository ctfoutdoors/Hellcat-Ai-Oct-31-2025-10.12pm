import { getDb } from "../db";
import { cases } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export interface PrioritySuggestion {
  suggestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  score: number;
  confidence: number;
  reasoning: string[];
  factors: {
    amountScore: number;
    carrierHistoryScore: number;
    ageScore: number;
    deadlineScore: number;
  };
}

export class PrioritySuggestionService {
  /**
   * Calculate suggested priority for a case based on multiple factors
   */
  static async suggestPriority(caseData: {
    disputeAmount: number;
    carrier: string;
    createdAt?: Date;
    deadline?: Date;
  }): Promise<PrioritySuggestion> {
    const db = await getDb();
    
    const reasoning: string[] = [];
    const factors = {
      amountScore: 0,
      carrierHistoryScore: 0,
      ageScore: 0,
      deadlineScore: 0,
    };

    // 1. Amount-based scoring (0-30 points)
    const amount = parseFloat(caseData.disputeAmount.toString());
    if (amount >= 100) {
      factors.amountScore = 30;
      reasoning.push(`High dispute amount ($${amount.toFixed(2)}) warrants urgent attention`);
    } else if (amount >= 50) {
      factors.amountScore = 20;
      reasoning.push(`Significant dispute amount ($${amount.toFixed(2)}) requires priority handling`);
    } else if (amount >= 20) {
      factors.amountScore = 10;
      reasoning.push(`Moderate dispute amount ($${amount.toFixed(2)})`);
    } else {
      factors.amountScore = 5;
      reasoning.push(`Lower dispute amount ($${amount.toFixed(2)})`);
    }

    // 2. Carrier history scoring (0-30 points)
    if (db) {
      try {
        const carrierCases = await db
          .select()
          .from(cases)
          .where(eq(cases.carrier, caseData.carrier));

        const totalCases = carrierCases.length;
        const resolvedCases = carrierCases.filter(c => c.status === "RESOLVED").length;
        const rejectedCases = carrierCases.filter(c => c.status === "REJECTED").length;

        if (totalCases > 0) {
          const resolutionRate = resolvedCases / totalCases;
          const rejectionRate = rejectedCases / totalCases;

          if (rejectionRate > 0.5) {
            factors.carrierHistoryScore = 30;
            reasoning.push(`${caseData.carrier} has high rejection rate (${(rejectionRate * 100).toFixed(0)}%) - requires careful handling`);
          } else if (rejectionRate > 0.3) {
            factors.carrierHistoryScore = 20;
            reasoning.push(`${caseData.carrier} has moderate rejection rate (${(rejectionRate * 100).toFixed(0)}%)`);
          } else if (resolutionRate > 0.7) {
            factors.carrierHistoryScore = 10;
            reasoning.push(`${caseData.carrier} has good resolution history (${(resolutionRate * 100).toFixed(0)}% success rate)`);
          } else {
            factors.carrierHistoryScore = 15;
            reasoning.push(`${caseData.carrier} has mixed resolution history`);
          }

          // Calculate average resolution time
          const resolvedWithDates = carrierCases.filter(
            c => c.status === "RESOLVED" && c.createdAt && c.updatedAt
          );
          
          if (resolvedWithDates.length > 0) {
            const avgDays = resolvedWithDates.reduce((sum, c) => {
              const days = Math.floor(
                (new Date(c.updatedAt!).getTime() - new Date(c.createdAt).getTime()) / 
                (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / resolvedWithDates.length;

            if (avgDays > 30) {
              factors.carrierHistoryScore += 5;
              reasoning.push(`${caseData.carrier} typically takes ${avgDays.toFixed(0)} days to resolve - start early`);
            }
          }
        } else {
          factors.carrierHistoryScore = 15;
          reasoning.push(`No historical data for ${caseData.carrier} - proceed with caution`);
        }
      } catch (error) {
        console.error("Error fetching carrier history:", error);
        factors.carrierHistoryScore = 15;
        reasoning.push(`Unable to assess ${caseData.carrier} history`);
      }
    } else {
      factors.carrierHistoryScore = 15;
      reasoning.push(`Database unavailable - using default carrier score`);
    }

    // 3. Age-based scoring (0-25 points)
    if (caseData.createdAt) {
      const ageInDays = Math.floor(
        (Date.now() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (ageInDays > 30) {
        factors.ageScore = 25;
        reasoning.push(`Case is ${ageInDays} days old - urgent action needed to avoid deadline`);
      } else if (ageInDays > 14) {
        factors.ageScore = 15;
        reasoning.push(`Case is ${ageInDays} days old - timely action recommended`);
      } else if (ageInDays > 7) {
        factors.ageScore = 10;
        reasoning.push(`Case is ${ageInDays} days old`);
      } else {
        factors.ageScore = 5;
        reasoning.push(`Recently created case (${ageInDays} days old)`);
      }
    } else {
      factors.ageScore = 5;
      reasoning.push(`New case - standard processing`);
    }

    // 4. Deadline proximity scoring (0-15 points)
    if (caseData.deadline) {
      const daysUntilDeadline = Math.floor(
        (new Date(caseData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline < 0) {
        factors.deadlineScore = 15;
        reasoning.push(`DEADLINE PASSED ${Math.abs(daysUntilDeadline)} days ago - URGENT`);
      } else if (daysUntilDeadline <= 3) {
        factors.deadlineScore = 15;
        reasoning.push(`Deadline in ${daysUntilDeadline} days - immediate action required`);
      } else if (daysUntilDeadline <= 7) {
        factors.deadlineScore = 10;
        reasoning.push(`Deadline in ${daysUntilDeadline} days - prioritize soon`);
      } else if (daysUntilDeadline <= 14) {
        factors.deadlineScore = 5;
        reasoning.push(`Deadline in ${daysUntilDeadline} days`);
      } else {
        factors.deadlineScore = 0;
        reasoning.push(`Sufficient time until deadline (${daysUntilDeadline} days)`);
      }
    } else {
      factors.deadlineScore = 0;
    }

    // Calculate total score (max 100)
    const totalScore =
      factors.amountScore +
      factors.carrierHistoryScore +
      factors.ageScore +
      factors.deadlineScore;

    // Map score to priority level
    let suggestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    let confidence: number;

    if (totalScore >= 75) {
      suggestedPriority = "URGENT";
      confidence = 0.95;
    } else if (totalScore >= 55) {
      suggestedPriority = "HIGH";
      confidence = 0.85;
    } else if (totalScore >= 35) {
      suggestedPriority = "MEDIUM";
      confidence = 0.75;
    } else {
      suggestedPriority = "LOW";
      confidence = 0.65;
    }

    // Adjust confidence based on data availability
    if (!db) confidence *= 0.8;
    if (!caseData.createdAt) confidence *= 0.9;
    if (!caseData.deadline) confidence *= 0.95;

    return {
      suggestedPriority,
      score: totalScore,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      factors,
    };
  }

  /**
   * Get priority suggestion for an existing case by ID
   */
  static async suggestPriorityForCase(caseId: number): Promise<PrioritySuggestion | null> {
    const db = await getDb();
    if (!db) return null;

    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
    });

    if (!caseData) return null;

    return this.suggestPriority({
      disputeAmount: parseFloat(caseData.disputeAmount || "0"),
      carrier: caseData.carrier,
      createdAt: caseData.createdAt,
      deadline: caseData.deadline || undefined,
    });
  }

  /**
   * Batch suggest priorities for multiple cases
   */
  static async batchSuggestPriorities(caseIds: number[]): Promise<Map<number, PrioritySuggestion>> {
    const db = await getDb();
    const suggestions = new Map<number, PrioritySuggestion>();

    if (!db) return suggestions;

    for (const caseId of caseIds) {
      const suggestion = await this.suggestPriorityForCase(caseId);
      if (suggestion) {
        suggestions.set(caseId, suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Get explanation for why a priority was suggested
   */
  static explainPriority(suggestion: PrioritySuggestion): string {
    const { suggestedPriority, score, confidence, reasoning } = suggestion;
    
    let explanation = `Suggested Priority: ${suggestedPriority}\n`;
    explanation += `Confidence: ${(confidence * 100).toFixed(0)}%\n`;
    explanation += `Score: ${score}/100\n\n`;
    explanation += `Reasoning:\n`;
    reasoning.forEach((reason, index) => {
      explanation += `${index + 1}. ${reason}\n`;
    });

    return explanation;
  }
}
