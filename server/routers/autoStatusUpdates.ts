import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { AutoStatusUpdatesService } from "../services/autoStatusUpdates";

export const autoStatusUpdatesRouter = router({
  /**
   * Analyze a carrier response email
   */
  analyzeResponse: publicProcedure
    .input(
      z.object({
        rawEmail: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const analysis = await AutoStatusUpdatesService.analyzeCarrierResponse(
        input.rawEmail
      );
      return analysis;
    }),

  /**
   * Process carrier response and update case status
   */
  processResponse: publicProcedure
    .input(
      z.object({
        rawEmail: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const result = await AutoStatusUpdatesService.processCarrierResponse(
        input.rawEmail,
        userId
      );
      return result;
    }),

  /**
   * Batch process multiple carrier responses
   */
  batchProcessResponses: publicProcedure
    .input(
      z.object({
        rawEmails: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const result = await AutoStatusUpdatesService.batchProcessResponses(
        input.rawEmails,
        userId
      );
      return result;
    }),

  /**
   * Create status update rule
   */
  createRule: publicProcedure
    .input(
      z.object({
        triggerKeywords: z.array(z.string()),
        targetStatus: z.string(),
        requiresApproval: z.boolean(),
        notifyUser: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      await AutoStatusUpdatesService.createStatusRule(input);
      return { success: true };
    }),
});
