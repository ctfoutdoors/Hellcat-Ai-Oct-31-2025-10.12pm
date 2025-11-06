import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { NotificationService } from "../services/notificationService";

export const notificationsRouter = router({
  /**
   * Get all notifications for the current user
   */
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return await NotificationService.getUserNotifications(ctx.user.id, input);
    }),

  /**
   * Get unread notification count
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await NotificationService.getUnreadCount(ctx.user.id);
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await NotificationService.markAsRead(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await NotificationService.markAllAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await NotificationService.deleteNotification(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Delete all read notifications
   */
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await NotificationService.deleteAllRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Get user notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await NotificationService.getOrCreatePreferences(ctx.user.id);
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        // Appearance
        position: z.enum(["TOP_LEFT", "TOP_RIGHT", "TOP_CENTER", "BOTTOM_LEFT", "BOTTOM_RIGHT", "BOTTOM_CENTER"]).optional(),
        size: z.enum(["COMPACT", "NORMAL", "LARGE"]).optional(),
        colors: z.string().optional(), // JSON string
        borderRadius: z.number().min(0).max(20).optional(),
        shadowIntensity: z.number().min(0).max(5).optional(),
        opacity: z.number().min(0).max(100).optional(),
        fontSize: z.number().min(12).max(18).optional(),

        // Animation
        animationType: z.enum(["SLIDE", "FADE", "BOUNCE", "SCALE", "FLIP", "NONE"]).optional(),
        animationDuration: z.number().min(0).max(2000).optional(),
        animationEasing: z.string().optional(),

        // Sound
        soundEnabled: z.boolean().optional(),
        soundType: z.string().optional(),
        soundVolume: z.number().min(0).max(100).optional(),

        // Vibration
        vibrationEnabled: z.boolean().optional(),
        vibrationPattern: z.string().optional(),

        // Content
        showIcons: z.boolean().optional(),
        showTimestamps: z.boolean().optional(),
        showActionButtons: z.boolean().optional(),
        showCloseButton: z.boolean().optional(),
        timestampFormat: z.string().optional(),
        iconStyle: z.string().optional(),

        // Behavior
        autoDismiss: z.boolean().optional(),
        autoDismissDuration: z.number().min(1000).max(30000).optional(),
        maxNotifications: z.number().min(1).max(10).optional(),
        stackBehavior: z.enum(["STACK", "REPLACE", "QUEUE"]).optional(),

        // Type toggles
        enableInfo: z.boolean().optional(),
        enableSuccess: z.boolean().optional(),
        enableWarning: z.boolean().optional(),
        enableError: z.boolean().optional(),

        // Quiet hours
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),

        // Do not disturb
        doNotDisturb: z.boolean().optional(),

        // Grouping
        groupSimilar: z.boolean().optional(),
        groupingWindow: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await NotificationService.updatePreferences(ctx.user.id, input);
    }),

  /**
   * Reset preferences to defaults
   */
  resetPreferences: protectedProcedure.mutation(async ({ ctx }) => {
    return await NotificationService.resetPreferences(ctx.user.id);
  }),

  /**
   * Create a test notification (for preview)
   */
  createTest: protectedProcedure
    .input(
      z.object({
        type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
        title: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await NotificationService.createNotification({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        priority: "NORMAL",
      });
    }),
});
