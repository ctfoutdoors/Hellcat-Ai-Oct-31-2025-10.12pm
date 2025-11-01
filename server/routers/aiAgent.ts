import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { AIAgentService } from "../services/aiAgent";

export const aiAgentRouter = router({
  /**
   * Process natural language request
   */
  processRequest: publicProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const result = await AIAgentService.processRequest(input.message, userId);
      return result;
    }),

  /**
   * Execute specific action
   */
  executeAction: publicProcedure
    .input(
      z.object({
        action: z.string(),
        parameters: z.record(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const result = await AIAgentService.executeAction(
        input.action,
        input.parameters,
        userId
      );
      return result;
    }),

  /**
   * Autonomous agent mode
   */
  autonomousMode: publicProcedure
    .input(
      z.object({
        goal: z.string(),
        maxActions: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const result = await AIAgentService.autonomousMode(
        input.goal,
        userId,
        input.maxActions
      );
      return result;
    }),

  /**
   * Get available agent functions
   */
  getFunctions: publicProcedure.query(() => {
    return {
      functions: AIAgentService.AGENT_FUNCTIONS,
    };
  }),
});
