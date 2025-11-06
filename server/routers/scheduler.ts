import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { DailySyncScheduler } from "../services/dailySyncScheduler";

export const schedulerRouter = router({
  /**
   * Get scheduler configuration
   */
  getConfig: publicProcedure.query(() => {
    return DailySyncScheduler.getConfig();
  }),

  /**
   * Update scheduler configuration
   */
  updateConfig: publicProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        cronExpression: z.string().optional(),
        dateRange: z.string().optional(),
        notifyOnCompletion: z.boolean().optional(),
        notifyOnError: z.boolean().optional(),
        adminEmail: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      DailySyncScheduler.updateConfig(input);
      return { success: true, config: DailySyncScheduler.getConfig() };
    }),

  /**
   * Get scheduler status
   */
  getStatus: publicProcedure.query(() => {
    return DailySyncScheduler.getStatus();
  }),

  /**
   * Trigger manual sync
   */
  triggerManualSync: publicProcedure.mutation(async () => {
    const result = await DailySyncScheduler.triggerManualSync();
    return result;
  }),

  /**
   * Stop all scheduled tasks
   */
  stopAll: publicProcedure.mutation(() => {
    DailySyncScheduler.stopAll();
    return { success: true };
  }),
});
