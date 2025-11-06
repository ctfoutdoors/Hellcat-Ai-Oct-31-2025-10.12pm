/**
 * Reminders Service
 * Deadline tracking and automated notifications
 */

import { getDb } from "../db";
import { reminders, cases } from "../../drizzle/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export interface CreateReminderInput {
  caseId: number;
  reminderType: "response_deadline" | "follow_up" | "escalation" | "document_submission" | "custom";
  title: string;
  description?: string;
  dueDate: Date;
  notifyDaysBefore?: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: number;
  createdBy: number;
}

export class RemindersService {
  /**
   * Create a new reminder
   */
  static async createReminder(input: CreateReminderInput): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(reminders).values({
      caseId: input.caseId,
      reminderType: input.reminderType,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      notifyDaysBefore: input.notifyDaysBefore || 3,
      priority: input.priority || "MEDIUM",
      assignedTo: input.assignedTo,
      createdBy: input.createdBy,
      status: "pending",
      notificationSent: 0,
    });

    console.log(`[Reminders] Created reminder: ${input.title} for case ${input.caseId}`);

    return Number(result.insertId);
  }

  /**
   * Get all reminders for a case
   */
  static async getRemindersByCase(caseId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.caseId, caseId))
      .orderBy(reminders.dueDate);
  }

  /**
   * Get all pending reminders
   */
  static async getPendingReminders() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.status, "pending"))
      .orderBy(reminders.dueDate);
  }

  /**
   * Get upcoming reminders (due within X days)
   */
  static async getUpcomingReminders(days: number = 7) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.status, "pending"),
          gte(reminders.dueDate, now),
          lte(reminders.dueDate, futureDate)
        )
      )
      .orderBy(reminders.dueDate);
  }

  /**
   * Get overdue reminders
   */
  static async getOverdueReminders() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();

    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.status, "pending"),
          lte(reminders.dueDate, now)
        )
      )
      .orderBy(reminders.dueDate);
  }

  /**
   * Mark reminder as completed
   */
  static async completeReminder(reminderId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(reminders)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reminders.id, reminderId));

    console.log(`[Reminders] Completed reminder ${reminderId}`);
  }

  /**
   * Cancel a reminder
   */
  static async cancelReminder(reminderId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(reminders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(reminders.id, reminderId));

    console.log(`[Reminders] Cancelled reminder ${reminderId}`);
  }

  /**
   * Check and send notifications for due reminders
   * This should be called by a cron job
   */
  static async checkAndSendNotifications(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    let notificationsSent = 0;

    // Get reminders that need notification
    const remindersToNotify = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.status, "pending"),
          eq(reminders.notificationSent, 0)
        )
      );

    for (const reminder of remindersToNotify) {
      // Calculate notification date
      const notifyDate = new Date(reminder.dueDate);
      notifyDate.setDate(notifyDate.getDate() - (reminder.notifyDaysBefore || 3));

      // Check if it's time to send notification
      if (now >= notifyDate) {
        // Get case details
        const caseData = await db.query.cases.findFirst({
          where: eq(cases.id, reminder.caseId),
        });

        if (caseData) {
          // Send notification
          const daysUntilDue = Math.ceil(
            (reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const message = `
**Reminder: ${reminder.title}**

Case: ${caseData.caseNumber}
Tracking: ${caseData.trackingId}
Due Date: ${reminder.dueDate.toLocaleDateString()}
Days Until Due: ${daysUntilDue}
Priority: ${reminder.priority}

${reminder.description || ""}
          `.trim();

          try {
            await notifyOwner({
              title: `⏰ Reminder: ${reminder.title}`,
              content: message,
            });

            // Mark notification as sent
            await db
              .update(reminders)
              .set({
                notificationSent: 1,
                notificationSentAt: new Date(),
                status: "sent",
                updatedAt: new Date(),
              })
              .where(eq(reminders.id, reminder.id));

            notificationsSent++;
            console.log(`[Reminders] Sent notification for reminder ${reminder.id}`);
          } catch (error) {
            console.error(`[Reminders] Failed to send notification for reminder ${reminder.id}:`, error);
          }
        }
      }
    }

    if (notificationsSent > 0) {
      console.log(`[Reminders] Sent ${notificationsSent} reminder notifications`);
    }

    return notificationsSent;
  }

  /**
   * Auto-create reminders for new cases
   */
  static async autoCreateReminders(caseId: number, createdBy: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
    });

    if (!caseData) return;

    // Create response deadline reminder (15 business days from filing)
    const responseDeadline = new Date();
    responseDeadline.setDate(responseDeadline.getDate() + 15);

    await this.createReminder({
      caseId,
      reminderType: "response_deadline",
      title: "Carrier Response Deadline",
      description: "Expected response from carrier within 15 business days",
      dueDate: responseDeadline,
      notifyDaysBefore: 3,
      priority: "HIGH",
      createdBy,
    });

    // Create follow-up reminder (30 days from filing)
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 30);

    await this.createReminder({
      caseId,
      reminderType: "follow_up",
      title: "Follow-up Required",
      description: "Check case status and follow up if no response received",
      dueDate: followUpDate,
      notifyDaysBefore: 5,
      priority: "MEDIUM",
      createdBy,
    });

    console.log(`[Reminders] Auto-created reminders for case ${caseId}`);
  }

  /**
   * Get reminder statistics
   */
  static async getStats() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allReminders = await db.select().from(reminders);

    const pending = allReminders.filter((r) => r.status === "pending").length;
    const completed = allReminders.filter((r) => r.status === "completed").length;
    const overdue = allReminders.filter(
      (r) => r.status === "pending" && new Date(r.dueDate) < new Date()
    ).length;

    return {
      total: allReminders.length,
      pending,
      completed,
      overdue,
      cancelled: allReminders.filter((r) => r.status === "cancelled").length,
    };
  }

  /**
   * Delete a reminder
   */
  static async deleteReminder(reminderId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(reminders).where(eq(reminders.id, reminderId));

    console.log(`[Reminders] Deleted reminder ${reminderId}`);
  }
}
