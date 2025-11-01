import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { PrioritySuggestionService } from "../services/prioritySuggestion";

export const prioritySuggestionsRouter = router({
  /**
   * Get priority suggestion for a new case
   */
  suggest: publicProcedure
    .input(
      z.object({
        disputeAmount: z.number(),
        carrier: z.string(),
        createdAt: z.date().optional(),
        deadline: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await PrioritySuggestionService.suggestPriority(input);
    }),

  /**
   * Get priority suggestion for an existing case
   */
  suggestForCase: publicProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await PrioritySuggestionService.suggestPriorityForCase(input.caseId);
    }),

  /**
   * Batch suggest priorities for multiple cases
   */
  batchSuggest: publicProcedure
    .input(z.object({ caseIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      const suggestions = await PrioritySuggestionService.batchSuggestPriorities(input.caseIds);
      
      // Convert Map to object for JSON serialization
      const result: Record<number, any> = {};
      suggestions.forEach((value, key) => {
        result[key] = value;
      });
      
      return result;
    }),
});
