/**
 * Letter Patterns Service
 * Store and retrieve successful dispute letter patterns for learning
 */

import { getDb } from "../db";
import { letterPatterns, cases } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface LetterPatternInput {
  caseId: number;
  letterContent: string;
  tone: "professional" | "firm" | "conciliatory";
  outcome?: "approved" | "partial" | "rejected" | "pending";
  recoveredAmount?: number;
  notes?: string;
}

export class LetterPatternsService {
  /**
   * Store a new letter pattern
   */
  static async storePattern(input: LetterPatternInput): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get case details
    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, input.caseId),
    });

    if (!caseData) {
      throw new Error(`Case ${input.caseId} not found`);
    }

    // Calculate success rate if outcome is known
    let successRate = null;
    if (input.outcome === "approved") {
      successRate = 100;
    } else if (input.outcome === "partial" && input.recoveredAmount && caseData.claimedAmount) {
      successRate = Math.round((input.recoveredAmount / caseData.claimedAmount) * 100);
    } else if (input.outcome === "rejected") {
      successRate = 0;
    }

    // Insert pattern
    const result = await db.insert(letterPatterns).values({
      caseId: input.caseId,
      carrier: caseData.carrier,
      disputeReason: caseData.notes?.substring(0, 255) || "Dimensional weight error",
      letterContent: input.letterContent,
      tone: input.tone,
      outcome: input.outcome,
      recoveredAmount: input.recoveredAmount,
      claimedAmount: caseData.claimedAmount,
      successRate,
      notes: input.notes,
      markedSuccessful: input.outcome === "approved" || input.outcome === "partial" ? 1 : 0,
      usageCount: 0,
    });

    return Number(result.insertId);
  }

  /**
   * Mark a letter pattern as successful
   */
  static async markAsSuccessful(
    patternId: number,
    outcome: "approved" | "partial",
    recoveredAmount?: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const pattern = await db.query.letterPatterns.findFirst({
      where: eq(letterPatterns.id, patternId),
    });

    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }

    // Calculate success rate
    let successRate = 100;
    if (outcome === "partial" && recoveredAmount && pattern.claimedAmount) {
      successRate = Math.round((recoveredAmount / pattern.claimedAmount) * 100);
    }

    await db
      .update(letterPatterns)
      .set({
        outcome,
        recoveredAmount,
        successRate,
        markedSuccessful: 1,
        updatedAt: new Date(),
      })
      .where(eq(letterPatterns.id, patternId));
  }

  /**
   * Get successful patterns for a specific carrier and dispute reason
   */
  static async getSuccessfulPatterns(
    carrier: string,
    disputeReason?: string,
    limit: number = 5
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let query = db
      .select()
      .from(letterPatterns)
      .where(
        and(
          eq(letterPatterns.carrier, carrier as any),
          eq(letterPatterns.markedSuccessful, 1)
        )
      )
      .orderBy(desc(letterPatterns.successRate), desc(letterPatterns.usageCount))
      .limit(limit);

    if (disputeReason) {
      query = db
        .select()
        .from(letterPatterns)
        .where(
          and(
            eq(letterPatterns.carrier, carrier as any),
            eq(letterPatterns.markedSuccessful, 1),
            sql`${letterPatterns.disputeReason} LIKE ${`%${disputeReason}%`}`
          )
        )
        .orderBy(desc(letterPatterns.successRate), desc(letterPatterns.usageCount))
        .limit(limit);
    }

    return await query;
  }

  /**
   * Increment usage count when a pattern is used
   */
  static async incrementUsage(patternId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(letterPatterns)
      .set({
        usageCount: sql`${letterPatterns.usageCount} + 1`,
      })
      .where(eq(letterPatterns.id, patternId));
  }

  /**
   * Get pattern statistics
   */
  static async getPatternStats() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const stats = await db
      .select({
        carrier: letterPatterns.carrier,
        totalPatterns: sql<number>`COUNT(*)`,
        successfulPatterns: sql<number>`SUM(CASE WHEN ${letterPatterns.markedSuccessful} = 1 THEN 1 ELSE 0 END)`,
        avgSuccessRate: sql<number>`AVG(CASE WHEN ${letterPatterns.successRate} IS NOT NULL THEN ${letterPatterns.successRate} ELSE 0 END)`,
      })
      .from(letterPatterns)
      .groupBy(letterPatterns.carrier);

    return stats;
  }

  /**
   * Get all patterns for a case
   */
  static async getPatternsByCase(caseId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(letterPatterns)
      .where(eq(letterPatterns.caseId, caseId))
      .orderBy(desc(letterPatterns.createdAt));
  }
}
