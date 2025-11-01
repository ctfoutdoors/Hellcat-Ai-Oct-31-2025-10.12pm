import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { EmailToCaseImporter } from "../services/emailToCaseImporter";

export const emailToCaseRouter = router({
  /**
   * Process a single email and create a case
   */
  processEmail: publicProcedure
    .input(
      z.object({
        rawEmail: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1; // Default to admin if not authenticated
      const caseId = await EmailToCaseImporter.createCaseFromEmail(
        input.rawEmail,
        userId
      );
      return { caseId, success: true };
    }),

  /**
   * Batch process multiple emails
   */
  batchProcessEmails: publicProcedure
    .input(
      z.object({
        rawEmails: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;
      const result = await EmailToCaseImporter.batchProcessEmails(
        input.rawEmails,
        userId
      );
      return result;
    }),

  /**
   * Extract data from email without creating case (for preview)
   */
  extractEmailData: publicProcedure
    .input(
      z.object({
        rawEmail: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { caseData, parsedEmail } = await EmailToCaseImporter.processEmail(
        input.rawEmail
      );
      return {
        caseData,
        emailMetadata: {
          subject: parsedEmail.subject,
          from: parsedEmail.from?.text,
          date: parsedEmail.date,
          attachmentCount: parsedEmail.attachments?.length || 0,
        },
      };
    }),
});
