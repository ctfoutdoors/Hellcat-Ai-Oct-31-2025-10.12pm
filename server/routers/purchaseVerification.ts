import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { PurchaseVerificationService } from "../services/purchaseVerificationService";

export const purchaseVerificationRouter = router({
  /**
   * Verify purchase for a case
   */
  verifyPurchase: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const result = await PurchaseVerificationService.verifyPurchase(input.caseId);
      return result;
    }),

  /**
   * Cross-check with WooCommerce
   */
  crossCheckWooCommerce: protectedProcedure
    .input(z.object({
      orderNumber: z.string(),
      customerEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      const result = await PurchaseVerificationService.crossCheckWooCommerce(
        input.orderNumber,
        input.customerEmail
      );
      return result;
    }),

  /**
   * Request receipt upload
   */
  requestReceipt: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await PurchaseVerificationService.requestReceipt(
        input.caseId,
        input.reason
      );
      return result;
    }),

  /**
   * Mark purchase as verified
   */
  markAsVerified: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      verifiedBy: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await PurchaseVerificationService.markAsVerified(
        input.caseId,
        input.verifiedBy,
        input.notes
      );
      return result;
    }),

  /**
   * Get verification statistics
   */
  getStatistics: protectedProcedure
    .query(async () => {
      const stats = await PurchaseVerificationService.getStatistics();
      return stats;
    }),

  /**
   * Bulk verify from Google Sheets
   */
  bulkVerifyFromSheet: protectedProcedure
    .input(z.object({
      purchases: z.array(z.object({
        orderNumber: z.string(),
        customerEmail: z.string().email(),
        purchaseDate: z.string(),
        purchaseSource: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const result = await PurchaseVerificationService.bulkVerifyFromSheet(input.purchases);
      return result;
    }),
});
