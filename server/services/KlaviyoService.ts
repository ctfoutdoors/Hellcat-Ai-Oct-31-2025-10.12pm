import { getDb } from "../db";
import { klaviyoProfiles, klaviyoReviews, InsertKlaviyoProfile, InsertKlaviyoReview } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

/**
 * Klaviyo API Integration Service
 * 
 * Fetches customer profiles, engagement metrics, and product reviews
 * API Docs: https://developers.klaviyo.com/en/reference/api_overview
 */

interface KlaviyoProfile {
  id: string;
  attributes: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    properties?: {
      lifetime_value?: number;
      total_orders?: number;
      average_order_value?: number;
      first_purchase?: string;
      last_purchase?: string;
    };
  };
}

interface KlaviyoMetric {
  email_open_rate?: number;
  email_click_rate?: number;
  total_emails_sent?: number;
  total_emails_opened?: number;
  total_emails_clicked?: number;
}

export class KlaviyoService {
  private static baseUrl = "https://a.klaviyo.com/api";
  private static apiKey = ENV.klaviyoPrivateKey;

  /**
   * Fetch customer profile by email
   */
  static async fetchCustomerProfile(customerEmail: string): Promise<{
    profile: typeof klaviyoProfiles.$inferSelect | null;
    reviews: typeof klaviyoReviews.$inferSelect[];
    stats: {
      lifetimeValue: number;
      totalOrders: number;
      averageOrderValue: number;
      emailOpenRate: number;
      emailClickRate: number;
      averageReviewRating: number;
      totalReviews: number;
    };
  }> {
    try {
      // Fetch profile from Klaviyo API
      const response = await fetch(
        `${this.baseUrl}/profiles/?filter=equals(email,"${encodeURIComponent(customerEmail)}")`,
        {
          headers: {
            Authorization: `Klaviyo-API-Key ${this.apiKey}`,
            "Content-Type": "application/json",
            revision: "2024-10-15",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return {
          profile: null,
          reviews: [],
          stats: {
            lifetimeValue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            emailOpenRate: 0,
            emailClickRate: 0,
            averageReviewRating: 0,
            totalReviews: 0,
          },
        };
      }

      const klaviyoProfile: KlaviyoProfile = data.data[0];

      // Store profile in database
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const profileData: InsertKlaviyoProfile = {
        klaviyoId: klaviyoProfile.id,
        email: customerEmail.toLowerCase(),
        lifetimeValue: Math.round((klaviyoProfile.attributes.properties?.lifetime_value || 0) * 100),
        totalOrders: klaviyoProfile.attributes.properties?.total_orders || 0,
        averageOrderValue: Math.round((klaviyoProfile.attributes.properties?.average_order_value || 0) * 100),
        firstPurchaseAt: klaviyoProfile.attributes.properties?.first_purchase
          ? new Date(klaviyoProfile.attributes.properties.first_purchase)
          : null,
        lastPurchaseAt: klaviyoProfile.attributes.properties?.last_purchase
          ? new Date(klaviyoProfile.attributes.properties.last_purchase)
          : null,
        syncedAt: new Date(),
      };

      // Fetch email metrics
      const metrics = await this.fetchEmailMetrics(klaviyoProfile.id);
      if (metrics) {
        profileData.emailOpenRate = Math.round((metrics.email_open_rate || 0) * 10000);
        profileData.emailClickRate = Math.round((metrics.email_click_rate || 0) * 10000);
        profileData.totalEmailsSent = metrics.total_emails_sent || 0;
        profileData.totalEmailsOpened = metrics.total_emails_opened || 0;
        profileData.totalEmailsClicked = metrics.total_emails_clicked || 0;
      }

      // Upsert profile
      await db
        .insert(klaviyoProfiles)
        .values(profileData)
        .onDuplicateKeyUpdate({
          set: {
            lifetimeValue: profileData.lifetimeValue,
            totalOrders: profileData.totalOrders,
            averageOrderValue: profileData.averageOrderValue,
            emailOpenRate: profileData.emailOpenRate,
            emailClickRate: profileData.emailClickRate,
            totalEmailsSent: profileData.totalEmailsSent,
            totalEmailsOpened: profileData.totalEmailsOpened,
            totalEmailsClicked: profileData.totalEmailsClicked,
            firstPurchaseAt: profileData.firstPurchaseAt,
            lastPurchaseAt: profileData.lastPurchaseAt,
            syncedAt: new Date(),
          },
        });

      // Fetch stored profile
      const [storedProfile] = await db
        .select()
        .from(klaviyoProfiles)
        .where(eq(klaviyoProfiles.klaviyoId, klaviyoProfile.id));

      // Fetch reviews (if available)
      const reviews = await this.fetchCustomerReviews(storedProfile.id);

      // Calculate stats
      const stats = {
        lifetimeValue: storedProfile.lifetimeValue,
        totalOrders: storedProfile.totalOrders,
        averageOrderValue: storedProfile.averageOrderValue,
        emailOpenRate: storedProfile.emailOpenRate || 0,
        emailClickRate: storedProfile.emailClickRate || 0,
        averageReviewRating: storedProfile.averageReviewRating || 0,
        totalReviews: storedProfile.totalReviews,
      };

      return {
        profile: storedProfile,
        reviews,
        stats,
      };
    } catch (error) {
      console.error("[Klaviyo] Error fetching profile:", error);
      throw error;
    }
  }

  /**
   * Fetch email engagement metrics
   */
  private static async fetchEmailMetrics(profileId: string): Promise<KlaviyoMetric | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/profiles/${profileId}/metrics/`,
        {
          headers: {
            Authorization: `Klaviyo-API-Key ${this.apiKey}`,
            "Content-Type": "application/json",
            revision: "2024-10-15",
          },
        }
      );

      if (!response.ok) {
        console.warn(`[Klaviyo] Failed to fetch metrics: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Parse metrics from response
      // Note: Actual API structure may vary, adjust as needed
      return {
        email_open_rate: data.email_open_rate || 0,
        email_click_rate: data.email_click_rate || 0,
        total_emails_sent: data.total_emails_sent || 0,
        total_emails_opened: data.total_emails_opened || 0,
        total_emails_clicked: data.total_emails_clicked || 0,
      };
    } catch (error) {
      console.warn("[Klaviyo] Error fetching metrics:", error);
      return null;
    }
  }

  /**
   * Fetch customer reviews
   */
  private static async fetchCustomerReviews(
    klaviyoProfileId: number
  ): Promise<typeof klaviyoReviews.$inferSelect[]> {
    const db = await getDb();
    if (!db) return [];

    // Fetch from database (reviews would be synced separately)
    const reviews = await db
      .select()
      .from(klaviyoReviews)
      .where(eq(klaviyoReviews.klaviyoProfileId, klaviyoProfileId));

    return reviews;
  }

  /**
   * Get cached profile from database
   */
  static async getCachedProfile(customerEmail: string): Promise<{
    profile: typeof klaviyoProfiles.$inferSelect | null;
    reviews: typeof klaviyoReviews.$inferSelect[];
    stats: {
      lifetimeValue: number;
      totalOrders: number;
      averageOrderValue: number;
      emailOpenRate: number;
      emailClickRate: number;
      averageReviewRating: number;
      totalReviews: number;
    };
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [profile] = await db
      .select()
      .from(klaviyoProfiles)
      .where(eq(klaviyoProfiles.email, customerEmail.toLowerCase()));

    if (!profile) {
      return {
        profile: null,
        reviews: [],
        stats: {
          lifetimeValue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          emailOpenRate: 0,
          emailClickRate: 0,
          averageReviewRating: 0,
          totalReviews: 0,
        },
      };
    }

    const reviews = await db
      .select()
      .from(klaviyoReviews)
      .where(eq(klaviyoReviews.klaviyoProfileId, profile.id));

    const stats = {
      lifetimeValue: profile.lifetimeValue,
      totalOrders: profile.totalOrders,
      averageOrderValue: profile.averageOrderValue,
      emailOpenRate: profile.emailOpenRate || 0,
      emailClickRate: profile.emailClickRate || 0,
      averageReviewRating: profile.averageReviewRating || 0,
      totalReviews: profile.totalReviews,
    };

    return { profile, reviews, stats };
  }

  /**
   * Calculate engagement risk score (0-100, higher = more risk)
   */
  static calculateEngagementRiskScore(stats: {
    emailOpenRate: number;
    emailClickRate: number;
    totalOrders: number;
    averageReviewRating: number;
  }): number {
    let riskScore = 0;

    // Low email engagement = risk
    const openRate = stats.emailOpenRate / 100; // Convert from basis points
    if (openRate < 20) riskScore += 25;
    else if (openRate < 40) riskScore += 10;

    const clickRate = stats.emailClickRate / 100;
    if (clickRate < 5) riskScore += 15;
    else if (clickRate < 10) riskScore += 5;

    // Low order count = risk (new customer)
    if (stats.totalOrders < 3) riskScore += 20;
    else if (stats.totalOrders < 10) riskScore += 10;

    // Low review rating = risk
    const avgRating = stats.averageReviewRating / 100; // Convert from basis points
    if (avgRating > 0) {
      if (avgRating < 3) riskScore += 30;
      else if (avgRating < 4) riskScore += 15;
    }

    return Math.min(100, riskScore);
  }
}
