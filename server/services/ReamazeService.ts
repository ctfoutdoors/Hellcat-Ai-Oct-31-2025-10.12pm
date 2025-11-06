import { getDb } from "../db";
import { reamazeTickets, InsertReamazeTicket } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

/**
 * Reamaze API Integration Service
 * 
 * Fetches customer support tickets and calculates support metrics
 * API Docs: https://www.reamaze.com/api
 */

interface ReamazeTicket {
  id: string;
  subject: string;
  status: string;
  category: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
  last_message_at?: string;
  messages_count: number;
  customer: {
    email: string;
    name: string;
  };
  satisfaction_score?: number;
}

interface ReamazeResponse {
  conversations: ReamazeTicket[];
  page_count: number;
  page_size: number;
}

export class ReamazeService {
  private static baseUrl = `https://${ENV.reamazeBrand}.reamaze.io/api/v1`;
  private static apiKey = ENV.reamazeApiKey;

  /**
   * Fetch all tickets for a customer by email
   */
  static async fetchCustomerTickets(customerEmail: string): Promise<{
    tickets: typeof reamazeTickets.$inferSelect[];
    stats: {
      totalTickets: number;
      openTickets: number;
      resolvedTickets: number;
      averageResolutionTimeHours: number;
      averageSatisfactionScore: number;
      averageSentiment: number;
    };
  }> {
    try {
      // Fetch from Reamaze API
      const response = await fetch(
        `${this.baseUrl}/conversations?q=${encodeURIComponent(customerEmail)}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.apiKey}:x`).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Reamaze API error: ${response.status} ${response.statusText}`);
      }

      const data: ReamazeResponse = await response.json();

      // Store tickets in database
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const storedTickets = [];

      for (const ticket of data.conversations) {
        const ticketData: InsertReamazeTicket = {
          reamazeId: ticket.id,
          customerEmail: customerEmail.toLowerCase(),
          subject: ticket.subject,
          status: ticket.status,
          category: ticket.category,
          priority: ticket.priority,
          messageCount: ticket.messages_count,
          satisfactionScore: ticket.satisfaction_score || null,
          createdAt: new Date(ticket.created_at),
          resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : null,
          lastMessageAt: ticket.last_message_at ? new Date(ticket.last_message_at) : null,
          syncedAt: new Date(),
        };

        // Calculate resolution time
        if (ticketData.resolvedAt && ticketData.createdAt) {
          const resolutionMs = ticketData.resolvedAt.getTime() - ticketData.createdAt.getTime();
          ticketData.resolutionTimeHours = Math.round(resolutionMs / (1000 * 60 * 60));
        }

        // Upsert ticket
        await db
          .insert(reamazeTickets)
          .values(ticketData)
          .onDuplicateKeyUpdate({
            set: {
              status: ticketData.status,
              messageCount: ticketData.messageCount,
              satisfactionScore: ticketData.satisfactionScore,
              resolvedAt: ticketData.resolvedAt,
              lastMessageAt: ticketData.lastMessageAt,
              resolutionTimeHours: ticketData.resolutionTimeHours,
              syncedAt: new Date(),
            },
          });

        // Fetch stored ticket
        const [stored] = await db
          .select()
          .from(reamazeTickets)
          .where(eq(reamazeTickets.reamazeId, ticket.id));

        if (stored) {
          storedTickets.push(stored);
        }
      }

      // Calculate stats
      const stats = this.calculateStats(storedTickets);

      return {
        tickets: storedTickets,
        stats,
      };
    } catch (error) {
      console.error("[Reamaze] Error fetching tickets:", error);
      throw error;
    }
  }

  /**
   * Get cached tickets from database
   */
  static async getCachedTickets(customerEmail: string): Promise<{
    tickets: typeof reamazeTickets.$inferSelect[];
    stats: {
      totalTickets: number;
      openTickets: number;
      resolvedTickets: number;
      averageResolutionTimeHours: number;
      averageSatisfactionScore: number;
      averageSentiment: number;
    };
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tickets = await db
      .select()
      .from(reamazeTickets)
      .where(eq(reamazeTickets.customerEmail, customerEmail.toLowerCase()));

    const stats = this.calculateStats(tickets);

    return { tickets, stats };
  }

  /**
   * Calculate support metrics
   */
  private static calculateStats(tickets: typeof reamazeTickets.$inferSelect[]): {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResolutionTimeHours: number;
    averageSatisfactionScore: number;
    averageSentiment: number;
  } {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status !== "resolved" && t.status !== "closed").length;
    const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

    // Average resolution time
    const resolvedWithTime = tickets.filter(t => t.resolutionTimeHours !== null);
    const averageResolutionTimeHours = resolvedWithTime.length > 0
      ? Math.round(
          resolvedWithTime.reduce((sum, t) => sum + (t.resolutionTimeHours || 0), 0) / resolvedWithTime.length
        )
      : 0;

    // Average satisfaction score
    const withSatisfaction = tickets.filter(t => t.satisfactionScore !== null);
    const averageSatisfactionScore = withSatisfaction.length > 0
      ? Math.round(
          (withSatisfaction.reduce((sum, t) => sum + (t.satisfactionScore || 0), 0) / withSatisfaction.length) * 10
        ) / 10
      : 0;

    // Average sentiment
    const withSentiment = tickets.filter(t => t.sentimentScore !== null);
    const averageSentiment = withSentiment.length > 0
      ? Math.round(
          withSentiment.reduce((sum, t) => sum + (t.sentimentScore || 0), 0) / withSentiment.length
        )
      : 0;

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      averageResolutionTimeHours,
      averageSatisfactionScore,
      averageSentiment,
    };
  }

  /**
   * Analyze ticket sentiment using AI
   */
  static async analyzeTicketSentiment(ticketId: number): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [ticket] = await db
      .select()
      .from(reamazeTickets)
      .where(eq(reamazeTickets.id, ticketId));

    if (!ticket || !ticket.firstMessage) {
      return 0;
    }

    // TODO: Use AI to analyze sentiment
    // For now, use satisfaction score as proxy
    if (ticket.satisfactionScore) {
      // Convert 1-5 scale to -100 to 100
      const sentiment = ((ticket.satisfactionScore - 3) / 2) * 100;
      return Math.round(sentiment);
    }

    return 0;
  }

  /**
   * Get support risk score (0-100, higher = more risk)
   */
  static calculateSupportRiskScore(stats: {
    totalTickets: number;
    openTickets: number;
    averageResolutionTimeHours: number;
    averageSatisfactionScore: number;
  }): number {
    let riskScore = 0;

    // High ticket volume = risk
    if (stats.totalTickets > 10) riskScore += 20;
    else if (stats.totalTickets > 5) riskScore += 10;

    // Open tickets = risk
    if (stats.openTickets > 3) riskScore += 25;
    else if (stats.openTickets > 1) riskScore += 15;

    // Slow resolution = risk
    if (stats.averageResolutionTimeHours > 72) riskScore += 20;
    else if (stats.averageResolutionTimeHours > 48) riskScore += 10;

    // Low satisfaction = risk
    if (stats.averageSatisfactionScore > 0) {
      if (stats.averageSatisfactionScore < 3) riskScore += 25;
      else if (stats.averageSatisfactionScore < 4) riskScore += 10;
    }

    return Math.min(100, riskScore);
  }
}
