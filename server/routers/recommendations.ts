import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { RecommendationService } from "../services/recommendationService";

export const recommendationsRouter = router({
  /**
   * Get action recommendations based on context
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        page: z.string(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        entityData: z.any().optional(),
        recentActions: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return RecommendationService.getRecommendations({
        ...input,
        userId: ctx.user.id,
        userRole: ctx.user.role,
      });
    }),

  /**
   * Execute voice command
   */
  executeVoiceCommand: protectedProcedure
    .input(
      z.object({
        command: z.string(),
        page: z.string(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        entityData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { command, ...context } = input;
      return RecommendationService.executeVoiceCommand(command, {
        ...context,
        userId: ctx.user.id,
        userRole: ctx.user.role,
      });
    }),
});
