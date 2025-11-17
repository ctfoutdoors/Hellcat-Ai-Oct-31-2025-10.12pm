/**
 * Meeting Completion Poller Service
 * 
 * Polls for completed meetings and automatically creates follow-up tasks
 * Runs every 5 minutes to check for meetings that have ended
 */

import { getDb } from "../db";
import { calendarMeetings, tasks } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Process completed meetings and create follow-up tasks
 */
export async function processCompletedMeetings() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[MeetingPoller] Database not available");
      return { processedCount: 0, tasks: [] };
    }

    // Find meetings that have ended and need task creation
    const now = new Date();
    const completedMeetings = await db
      .select()
      .from(calendarMeetings)
      .where(
        and(
          eq(calendarMeetings.autoTaskEnabled, true),
          eq(calendarMeetings.taskCreated, false),
          lt(calendarMeetings.endTime, now)
        )
      );

    if (completedMeetings.length === 0) {
      console.log("[MeetingPoller] No completed meetings to process");
      return { processedCount: 0, tasks: [] };
    }

    console.log(`[MeetingPoller] Processing ${completedMeetings.length} completed meetings`);

    const createdTasks = [];
    for (const meeting of completedMeetings) {
      try {
        // Create follow-up task
        const taskResult = await db.insert(tasks).values({
          entityType: meeting.entityType,
          entityId: meeting.entityId,
          title: `Follow-up: ${meeting.summary}`,
          description: `Follow up on meeting: ${meeting.description || meeting.summary}`,
          priority: "medium",
          status: "pending",
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due tomorrow
        });

        // Mark meeting as processed
        await db
          .update(calendarMeetings)
          .set({ 
            taskCreated: true, 
            createdTaskId: Number(taskResult.insertId) 
          })
          .where(eq(calendarMeetings.id, meeting.id));

        createdTasks.push({
          meetingId: meeting.id,
          taskId: taskResult.insertId,
          summary: meeting.summary,
          entityType: meeting.entityType,
          entityId: meeting.entityId,
        });

        console.log(`[MeetingPoller] Created task for meeting: ${meeting.summary}`);
      } catch (error) {
        console.error(`[MeetingPoller] Failed to process meeting ${meeting.id}:`, error);
      }
    }

    console.log(`[MeetingPoller] Successfully processed ${createdTasks.length} meetings`);
    return { processedCount: createdTasks.length, tasks: createdTasks };
  } catch (error) {
    console.error("[MeetingPoller] Error processing completed meetings:", error);
    return { processedCount: 0, tasks: [] };
  }
}

/**
 * Start the polling service
 * Runs every 5 minutes
 */
export function startMeetingCompletionPoller() {
  if (pollingInterval) {
    console.log("[MeetingPoller] Already running");
    return;
  }

  console.log("[MeetingPoller] Starting meeting completion poller (5 min interval)");
  
  // Run immediately on start
  processCompletedMeetings();

  // Then run every 5 minutes
  pollingInterval = setInterval(() => {
    processCompletedMeetings();
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Stop the polling service
 */
export function stopMeetingCompletionPoller() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("[MeetingPoller] Stopped meeting completion poller");
  }
}

/**
 * Get poller status
 */
export function getMeetingPollerStatus() {
  return {
    running: pollingInterval !== null,
    intervalMinutes: 5,
  };
}
