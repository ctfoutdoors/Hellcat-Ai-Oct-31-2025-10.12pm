/**
 * Time-Based Status Rules Service
 * Automatically updates case statuses based on time elapsed
 */

import { getDb } from "../db";
import { cases, activityLogs } from "../../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";

interface TimeBasedRule {
  fromStatus: string;
  toStatus: string;
  daysElapsed: number;
  reason: string;
}

// Define time-based rules
const TIME_BASED_RULES: TimeBasedRule[] = [
  {
    fromStatus: "Submitted",
    toStatus: "Follow-up Needed",
    daysElapsed: 30,
    reason: "No response received after 30 days",
  },
  {
    fromStatus: "Pending Review",
    toStatus: "Follow-up Needed",
    daysElapsed: 21,
    reason: "No response received after 21 days",
  },
  {
    fromStatus: "Under Investigation",
    toStatus: "Follow-up Needed",
    daysElapsed: 45,
    reason: "Investigation taking longer than expected (45 days)",
  },
  {
    fromStatus: "Follow-up Needed",
    toStatus: "Escalated",
    daysElapsed: 14,
    reason: "No response to follow-up after 14 days",
  },
];

export class TimeBasedStatusRulesService {
  /**
   * Check and apply time-based status rules to all eligible cases
   */
  static async applyTimeBasedRules(): Promise<{
    casesUpdated: number;
    updates: Array<{ caseId: number; caseNumber: string; oldStatus: string; newStatus: string }>;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const updates: Array<{ caseId: number; caseNumber: string; oldStatus: string; newStatus: string }> = [];

    for (const rule of TIME_BASED_RULES) {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rule.daysElapsed);

      // Find cases matching the rule criteria
      const eligibleCases = await db
        .select()
        .from(cases)
        .where(
          and(
            eq(cases.status, rule.fromStatus),
            lt(cases.updatedAt, cutoffDate)
          )
        );

      // Update each eligible case
      for (const caseRecord of eligibleCases) {
        try {
          // Update case status
          await db
            .update(cases)
            .set({
              status: rule.toStatus,
              updatedAt: new Date(),
            })
            .where(eq(cases.id, caseRecord.id));

          // Log activity
          await db.insert(activityLogs).values({
            caseId: caseRecord.id,
            activityType: "status_change",
            description: `Status automatically updated from "${rule.fromStatus}" to "${rule.toStatus}": ${rule.reason}`,
            performedBy: "System",
            timestamp: new Date(),
          });

          updates.push({
            caseId: caseRecord.id,
            caseNumber: caseRecord.caseNumber,
            oldStatus: rule.fromStatus,
            newStatus: rule.toStatus,
          });

          console.log(
            `[TimeBasedRules] Updated case ${caseRecord.caseNumber}: ${rule.fromStatus} → ${rule.toStatus}`
          );
        } catch (error) {
          console.error(
            `[TimeBasedRules] Failed to update case ${caseRecord.id}:`,
            error
          );
        }
      }
    }

    return {
      casesUpdated: updates.length,
      updates,
    };
  }

  /**
   * Get all time-based rules
   */
  static getTimeBasedRules(): TimeBasedRule[] {
    return TIME_BASED_RULES;
  }

  /**
   * Check if a specific case is eligible for any time-based rule
   */
  static async checkCaseEligibility(caseId: number): Promise<{
    eligible: boolean;
    rule?: TimeBasedRule;
    daysUntilTrigger?: number;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const caseRecord = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
    });

    if (!caseRecord) {
      return { eligible: false };
    }

    // Find applicable rule
    const applicableRule = TIME_BASED_RULES.find(
      (rule) => rule.fromStatus === caseRecord.status
    );

    if (!applicableRule) {
      return { eligible: false };
    }

    // Calculate days since last update
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(caseRecord.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysUntilTrigger = applicableRule.daysElapsed - daysSinceUpdate;

    return {
      eligible: daysUntilTrigger <= 0,
      rule: applicableRule,
      daysUntilTrigger: Math.max(0, daysUntilTrigger),
    };
  }
}
