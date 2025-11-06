import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ProactiveSuggestionService } from "../services/proactiveSuggestionService";
import { AITrainingService } from "../services/aiTrainingService";

export const aiEnhancementsRouter = router({
  // Proactive Suggestions
  getProactiveSuggestions: protectedProcedure
    .input(
      z.object({
        currentPage: z.string(),
        context: z
          .object({
            entityType: z.string().optional(),
            entityId: z.number().optional(),
            recentActions: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ProactiveSuggestionService.generateProactiveSuggestions(
        ctx.user.id,
        input.currentPage,
        input.context
      );
    }),

  trackUserAction: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        page: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ProactiveSuggestionService.trackUserAction(
        ctx.user.id,
        input.action,
        input.page
      );
      return { success: true };
    }),

  dismissSuggestion: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ProactiveSuggestionService.dismissSuggestion(
        ctx.user.id,
        input.suggestionId
      );
      return { success: true };
    }),

  acceptSuggestion: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ProactiveSuggestionService.acceptSuggestion(
        ctx.user.id,
        input.suggestionId
      );
      return { success: true };
    }),

  // AI Training
  teachCommand: protectedProcedure
    .input(
      z.object({
        userPhrase: z.string(),
        intendedAction: z.string(),
        actionData: z.any().optional(),
        examples: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AITrainingService.teachCommand(
        ctx.user.id,
        input.userPhrase,
        input.intendedAction,
        input.actionData,
        input.examples
      );
    }),

  correctCommand: protectedProcedure
    .input(
      z.object({
        originalCommand: z.string(),
        aiInterpretation: z.string(),
        correctInterpretation: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AITrainingService.correctCommand(
        ctx.user.id,
        input.originalCommand,
        input.aiInterpretation,
        input.correctInterpretation
      );
    }),

  getCustomCommands: protectedProcedure.query(async ({ ctx }) => {
    return AITrainingService.getCustomCommands(ctx.user.id);
  }),

  getCommandCorrections: protectedProcedure.query(async ({ ctx }) => {
    return AITrainingService.getCommandCorrections(ctx.user.id);
  }),

  deleteCustomCommand: protectedProcedure
    .input(z.object({ commandId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await AITrainingService.deleteCustomCommand(ctx.user.id, input.commandId);
      return { success: true };
    }),

  updateCustomCommand: protectedProcedure
    .input(
      z.object({
        commandId: z.string(),
        updates: z.object({
          userPhrase: z.string().optional(),
          intendedAction: z.string().optional(),
          actionData: z.any().optional(),
          examples: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AITrainingService.updateCustomCommand(
        ctx.user.id,
        input.commandId,
        input.updates
      );
    }),

  exportCustomCommands: protectedProcedure.query(async ({ ctx }) => {
    return AITrainingService.exportCustomCommands(ctx.user.id);
  }),

  importCustomCommands: protectedProcedure
    .input(z.object({ jsonData: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const count = await AITrainingService.importCustomCommands(
        ctx.user.id,
        input.jsonData
      );
      return { success: true, importedCount: count };
    }),

  getTrainingStats: protectedProcedure.query(async ({ ctx }) => {
    return AITrainingService.getTrainingStats(ctx.user.id);
  }),
});
