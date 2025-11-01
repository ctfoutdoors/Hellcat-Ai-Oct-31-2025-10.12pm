import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { ReminderService } from "../services/reminderService";

export const remindersRouter = router({
  /**
   * Create a new reminder
   */
  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      type: z.enum(['follow_up', 'deadline', 'status_check', 'document_needed', 'custom']),
      title: z.string(),
      description: z.string(),
      dueDate: z.string().transform(str => new Date(str)),
      notifyVia: z.array(z.enum(['email', 'sms', 'in_app'])),
      recurring: z.boolean().optional(),
      recurringInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }))
    .mutation(async ({ input }) => {
      const reminder = ReminderService.createReminder(input);
      return { success: true, reminder };
    }),

  /**
   * Get reminders for a case
   */
  getByCase: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const reminders = ReminderService.getRemindersByCase(input.caseId);
      return { reminders };
    }),

  /**
   * Get upcoming reminders
   */
  getUpcoming: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(7) }))
    .query(async ({ input }) => {
      const reminders = ReminderService.getUpcomingReminders(input.daysAhead);
      return { reminders };
    }),

  /**
   * Get overdue reminders
   */
  getOverdue: protectedProcedure
    .query(async () => {
      const reminders = ReminderService.getOverdueReminders();
      return { reminders };
    }),

  /**
   * Complete a reminder
   */
  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const reminder = ReminderService.completeReminder(input.id);
      return { success: !!reminder, reminder };
    }),

  /**
   * Delete a reminder
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const success = ReminderService.deleteReminder(input.id);
      return { success };
    }),

  /**
   * Send reminder notifications
   */
  sendNotifications: protectedProcedure
    .mutation(async () => {
      const result = await ReminderService.sendReminderNotifications();
      return result;
    }),

  /**
   * Auto-create reminders based on rules
   */
  autoCreate: protectedProcedure
    .mutation(async () => {
      const result = await ReminderService.autoCreateReminders();
      return result;
    }),

  /**
   * Get reminder statistics
   */
  getStatistics: protectedProcedure
    .query(async () => {
      const stats = ReminderService.getStatistics();
      return stats;
    }),
});
