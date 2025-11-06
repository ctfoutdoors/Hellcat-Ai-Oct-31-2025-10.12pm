import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { ScreenshotOCRService } from '../services/screenshotOCR';

export const screenshotOCRRouter = router({
  /**
   * Extract text from screenshot
   */
  extractText: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ScreenshotOCRService.extractText(input.imageUrl);
      return result;
    }),

  /**
   * Extract tracking data from screenshot
   */
  extractTrackingData: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ScreenshotOCRService.extractTrackingData(input.imageUrl);
      return result;
    }),

  /**
   * Extract invoice data from screenshot
   */
  extractInvoiceData: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ScreenshotOCRService.extractInvoiceData(input.imageUrl);
      return result;
    }),

  /**
   * Identify document type
   */
  identifyDocumentType: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ScreenshotOCRService.identifyDocumentType(input.imageUrl);
      return result;
    }),
});
