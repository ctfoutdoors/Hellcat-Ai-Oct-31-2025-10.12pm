import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { LetterPatternsService } from "../services/letterPatternsService";

export const letterPatternsRouter = router({
  /**
   * Store a new letter pattern
   */
  store: publicProcedure
    .input(
      z.object({
        caseId: z.number(),
        letterContent: z.string(),
        tone: z.enum(["professional", "firm", "conciliatory"]),
        outcome: z.enum(["approved", "partial", "rejected", "pending"]).optional(),
        recoveredAmount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const patternId = await LetterPatternsService.storePattern(input);
      return { success: true, patternId };
    }),

  /**
   * Mark a pattern as successful
   */
  markSuccessful: publicProcedure
    .input(
      z.object({
        patternId: z.number(),
        outcome: z.enum(["approved", "partial"]),
        recoveredAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await LetterPatternsService.markAsSuccessful(
        input.patternId,
        input.outcome,
        input.recoveredAmount
      );
      return { success: true };
    }),

  /**
   * Get successful patterns for reference
   */
  getSuccessful: publicProcedure
    .input(
      z.object({
        carrier: z.string(),
        disputeReason: z.string().optional(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const patterns = await LetterPatternsService.getSuccessfulPatterns(
        input.carrier,
        input.disputeReason,
        input.limit
      );
      return { patterns };
    }),

  /**
   * Get pattern statistics
   */
  getStats: publicProcedure.query(async () => {
    const stats = await LetterPatternsService.getPatternStats();
    return { stats };
  }),

  /**
   * Get patterns for a specific case
   */
  getByCase: publicProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const patterns = await LetterPatternsService.getPatternsByCase(input.caseId);
      return { patterns };
    }),
});
