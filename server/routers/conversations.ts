import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ConversationService } from "../services/conversationService";

export const conversationsRouter = router({
  /**
   * Create a new conversation session
   */
  createSession: protectedProcedure
    .input(
      z.object({
        page: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await ConversationService.createSession(
        ctx.user.id,
        input.page,
        input.entityType,
        input.entityId
      );
      return { sessionId };
    }),

  /**
   * Add a message to conversation
   */
  addMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        page: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ConversationService.addMessage(
        ctx.user.id,
        input.sessionId,
        input.role,
        input.content,
        input.page,
        input.entityType,
        input.entityId,
        input.metadata
      );
      return { success: true };
    }),

  /**
   * Get conversation history for a session
   */
  getSessionHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return await ConversationService.getSessionHistory(input.sessionId);
    }),

  /**
   * Get recent sessions
   */
  getRecentSessions: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return await ConversationService.getRecentSessions(
        ctx.user.id,
        input.limit
      );
    }),

  /**
   * Get last active session
   */
  getLastSession: protectedProcedure.query(async ({ ctx }) => {
    return await ConversationService.getLastSession(ctx.user.id);
  }),

  /**
   * End a conversation session
   */
  endSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        summary: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await ConversationService.endSession(input.sessionId, input.summary);
      return { success: true };
    }),

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await ConversationService.getUserPreferences(ctx.user.id);
  }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferredActions: z.array(z.string()).optional(),
        frequentCommands: z.record(z.number()).optional(),
        communicationStyle: z
          .enum(["formal", "casual", "concise", "detailed"])
          .optional(),
        recommendationFrequency: z.enum(["high", "medium", "low"]).optional(),
        lastPage: z.string().optional(),
        lastEntityType: z.string().optional(),
        lastEntityId: z.number().optional(),
        lastSessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ConversationService.updatePreferences(ctx.user.id, input);
      return { success: true };
    }),

  /**
   * Track command usage
   */
  trackCommand: protectedProcedure
    .input(z.object({ command: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ConversationService.trackCommandUsage(ctx.user.id, input.command);
      return { success: true };
    }),

  /**
   * Track recommendation feedback
   */
  trackFeedback: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        accepted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ConversationService.trackRecommendationFeedback(
        ctx.user.id,
        input.recommendationId,
        input.accepted
      );
      return { success: true };
    }),

  /**
   * Get conversation context
   */
  getContext: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      return await ConversationService.getConversationContext(
        input.sessionId,
        input.limit
      );
    }),

  /**
   * Search conversations
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ConversationService.searchConversations(
        ctx.user.id,
        input.query,
        input.limit
      );
    }),

  /**
   * Clear conversation history
   */
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    await ConversationService.clearHistory(ctx.user.id);
    return { success: true };
  }),
});
