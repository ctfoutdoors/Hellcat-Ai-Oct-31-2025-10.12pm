import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { DocumentCategorizationService } from '../services/documentCategorization';

export const documentCategorizationRouter = router({
  /**
   * Categorize document
   */
  categorizeDocument: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const category = await DocumentCategorizationService.categorizeDocument({
        filename: input.filename,
        content: input.content,
        imageUrl: input.imageUrl,
      });

      return {
        success: true,
        category,
      };
    }),

  /**
   * Suggest case associations
   */
  suggestCaseAssociations: protectedProcedure
    .input(
      z.object({
        trackingNumber: z.string().optional(),
        invoiceNumber: z.string().optional(),
        amount: z.number().optional(),
        date: z.string().optional(),
        carrier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const caseIds = await DocumentCategorizationService.suggestCaseAssociations(input);

      return {
        success: true,
        caseIds,
      };
    }),

  /**
   * Auto-tag document
   */
  autoTag: protectedProcedure
    .input(
      z.object({
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const tags = await DocumentCategorizationService.autoTag(input.content);

      return {
        success: true,
        tags,
      };
    }),
});
