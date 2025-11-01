import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { activityLogService } from '../services/ActivityLogService';

export const activityLogsRouter = router({
  // Get activity logs for a case
  getByCase: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const logs = await activityLogService.getActivityLogs(
        input.caseId,
        input.limit
      );
      return logs;
    }),

  // Get recent activity across all cases
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const logs = await activityLogService.getRecentActivity(input.limit);
      return logs;
    }),

  // Get activity by type
  getByType: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      activityType: z.string(),
    }))
    .query(async ({ input }) => {
      const logs = await activityLogService.getActivityByType(
        input.caseId,
        input.activityType
      );
      return logs;
    }),

  // Get activity by actor
  getByActor: protectedProcedure
    .input(z.object({
      actorId: z.number(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const logs = await activityLogService.getActivityByActor(
        input.actorId,
        input.limit
      );
      return logs;
    }),

  // Get activity by date range
  getByDateRange: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      const logs = await activityLogService.getActivityByDateRange(
        input.caseId,
        input.startDate,
        input.endDate
      );
      return logs;
    }),

  // Get activity statistics
  getStats: protectedProcedure
    .input(z.object({
      caseId: z.number(),
    }))
    .query(async ({ input }) => {
      const stats = await activityLogService.getActivityStats(input.caseId);
      return stats;
    }),

  // Manual log (for custom activities)
  log: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      activityType: z.string(),
      description: z.string(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await activityLogService.logActivity({
        ...input,
        actorId: ctx.user.id,
        actorName: ctx.user.name || 'Unknown',
        actorType: 'USER',
      });
      return { success: true };
    }),
});
