/**
 * Bulk Actions History Service
 * Track bulk operations and enable undo functionality
 */

import { getDb } from "../db";
import { cases } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export interface BulkActionSnapshot {
  actionId: string;
  actionType: "status_change" | "assignment" | "deletion" | "tag_update";
  timestamp: Date;
  performedBy: string;
  caseSnapshots: Array<{
    caseId: number;
    previousState: any;
  }>;
}

// In-memory store for recent bulk actions (last 50 actions)
const actionHistory: BulkActionSnapshot[] = [];
const MAX_HISTORY_SIZE = 50;

export class BulkActionsHistoryService {
  /**
   * Record a bulk action before executing it
   */
  static async recordAction(
    actionType: BulkActionSnapshot["actionType"],
    caseIds: number[],
    performedBy: string
  ): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Generate action ID
    const actionId = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Capture current state of all affected cases
    const casesData = await db
      .select()
      .from(cases)
      .where(inArray(cases.id, caseIds));

    const caseSnapshots = casesData.map((caseData) => ({
      caseId: caseData.id,
      previousState: {
        status: caseData.status,
        assignedTo: caseData.assignedTo,
        priority: caseData.priority,
        tags: caseData.tags,
        notes: caseData.notes,
      },
    }));

    // Store snapshot
    const snapshot: BulkActionSnapshot = {
      actionId,
      actionType,
      timestamp: new Date(),
      performedBy,
      caseSnapshots,
    };

    // Add to history (FIFO - remove oldest if exceeds limit)
    actionHistory.unshift(snapshot);
    if (actionHistory.length > MAX_HISTORY_SIZE) {
      actionHistory.pop();
    }

    console.log(`[BulkActionsHistory] Recorded action ${actionId}: ${actionType} on ${caseIds.length} cases`);

    return actionId;
  }

  /**
   * Undo a bulk action
   */
  static async undoAction(actionId: string): Promise<{
    success: boolean;
    casesRestored: number;
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Find the action snapshot
    const snapshotIndex = actionHistory.findIndex((s) => s.actionId === actionId);
    if (snapshotIndex === -1) {
      throw new Error(`Action ${actionId} not found in history (may have expired)`);
    }

    const snapshot = actionHistory[snapshotIndex];

    // Restore each case to its previous state
    let casesRestored = 0;
    for (const caseSnapshot of snapshot.caseSnapshots) {
      try {
        await db
          .update(cases)
          .set({
            status: caseSnapshot.previousState.status,
            assignedTo: caseSnapshot.previousState.assignedTo,
            priority: caseSnapshot.previousState.priority,
            tags: caseSnapshot.previousState.tags,
            notes: caseSnapshot.previousState.notes,
            updatedAt: new Date(),
          })
          .where(eq(cases.id, caseSnapshot.caseId));

        casesRestored++;
      } catch (error) {
        console.error(`[BulkActionsHistory] Failed to restore case ${caseSnapshot.caseId}:`, error);
      }
    }

    // Remove the action from history after undo
    actionHistory.splice(snapshotIndex, 1);

    console.log(`[BulkActionsHistory] Undone action ${actionId}: restored ${casesRestored} cases`);

    return {
      success: true,
      casesRestored,
    };
  }

  /**
   * Get recent action history
   */
  static getRecentActions(limit: number = 10): BulkActionSnapshot[] {
    return actionHistory.slice(0, limit).map((snapshot) => ({
      ...snapshot,
      caseSnapshots: snapshot.caseSnapshots.map((cs) => ({
        caseId: cs.caseId,
        previousState: cs.previousState,
      })),
    }));
  }

  /**
   * Get a specific action by ID
   */
  static getAction(actionId: string): BulkActionSnapshot | undefined {
    return actionHistory.find((s) => s.actionId === actionId);
  }

  /**
   * Clear action history (admin only)
   */
  static clearHistory(): void {
    actionHistory.length = 0;
    console.log("[BulkActionsHistory] History cleared");
  }

  /**
   * Get action history size
   */
  static getHistorySize(): number {
    return actionHistory.length;
  }
}
