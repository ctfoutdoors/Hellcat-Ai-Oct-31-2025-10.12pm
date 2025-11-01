import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { PDFInvoiceScanner } from "../services/pdfInvoiceScanner";
import { TRPCError } from "@trpc/server";

export const pdfInvoiceScannerRouter = router({
  /**
   * Process a single PDF invoice
   */
  processInvoice: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string(), // Base64 encoded PDF
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const pdfBuffer = Buffer.from(input.pdfBase64, "base64");
        const invoiceData = await PDFInvoiceScanner.processInvoice(pdfBuffer);
        
        return {
          success: true,
          invoiceData,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to process PDF invoice",
        });
      }
    }),

  /**
   * Process PDF and auto-create cases
   */
  processAndCreateCases: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const pdfBuffer = Buffer.from(input.pdfBase64, "base64");
        const invoiceData = await PDFInvoiceScanner.processInvoice(pdfBuffer);
        const caseIds = await PDFInvoiceScanner.autoCreateCasesFromInvoice(
          invoiceData,
          ctx.user.id
        );

        return {
          success: true,
          invoiceData,
          casesCreated: caseIds.length,
          caseIds,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to process PDF and create cases",
        });
      }
    }),

  /**
   * Batch process multiple PDFs
   */
  batchProcess: protectedProcedure
    .input(
      z.object({
        pdfsBase64: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const pdfBuffers = input.pdfsBase64.map((base64) =>
          Buffer.from(base64, "base64")
        );
        
        const result = await PDFInvoiceScanner.batchProcessInvoices(
          pdfBuffers,
          ctx.user.id
        );

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to batch process PDFs",
        });
      }
    }),
});
