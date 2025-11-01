import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { carrierResponseParser } from '../services/CarrierResponseParser';
import { getDb } from '../db';
import { emailCommunications, cases } from '../../drizzle/schema';
import { eq, and, desc, isNull, isNotNull } from 'drizzle-orm';

export const carrierResponsesRouter = router({
  // Parse a carrier response email
  parseEmail: protectedProcedure
    .input(z.object({
      emailId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await carrierResponseParser.processCarrierEmail(input.emailId);
      return { success: true };
    }),

  // Batch process multiple emails
  batchParseEmails: protectedProcedure
    .input(z.object({
      emailIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      await carrierResponseParser.batchProcessEmails(input.emailIds);
      return { success: true };
    }),

  // Get unprocessed carrier emails
  getUnprocessedEmails: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get emails that haven't been AI-parsed yet
      const emails = await db
        .select()
        .from(emailCommunications)
        .where(
          and(
            eq(emailCommunications.direction, 'INBOUND'),
            isNull(emailCommunications.aiParsedData)
          )
        )
        .orderBy(desc(emailCommunications.receivedAt))
        .limit(50);

      return emails;
    }),

  // Get processed carrier responses
  getProcessedResponses: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      responseType: z.enum(['APPROVED', 'DENIED', 'PENDING', 'REQUIRES_INFO', 'PAYMENT_ISSUED', 'UNKNOWN']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db
        .select()
        .from(emailCommunications)
        .where(
          and(
            eq(emailCommunications.direction, 'INBOUND'),
            isNotNull(emailCommunications.aiParsedData)
          )
        )
        .orderBy(desc(emailCommunications.receivedAt));

      if (input.caseId) {
        query = query.where(eq(emailCommunications.caseId, input.caseId)) as any;
      }

      const emails = await query;

      // Parse and filter by response type if specified
      const responses = emails.map(email => {
        const parsed = email.aiParsedData ? JSON.parse(email.aiParsedData) : null;
        return {
          ...email,
          parsedData: parsed,
        };
      });

      if (input.responseType) {
        return responses.filter(r => r.parsedData?.responseType === input.responseType);
      }

      return responses;
    }),

  // Get response statistics
  getResponseStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const emails = await db
        .select()
        .from(emailCommunications)
        .where(
          and(
            eq(emailCommunications.direction, 'INBOUND'),
            isNotNull(emailCommunications.aiParsedData)
          )
        );

      const stats = {
        total: emails.length,
        approved: 0,
        denied: 0,
        pending: 0,
        requiresInfo: 0,
        paymentIssued: 0,
        unknown: 0,
        averageConfidence: 0,
      };

      let totalConfidence = 0;

      emails.forEach(email => {
        if (email.aiParsedData) {
          const parsed = JSON.parse(email.aiParsedData);
          totalConfidence += parsed.confidence || 0;

          switch (parsed.responseType) {
            case 'APPROVED':
              stats.approved++;
              break;
            case 'DENIED':
              stats.denied++;
              break;
            case 'PENDING':
              stats.pending++;
              break;
            case 'REQUIRES_INFO':
              stats.requiresInfo++;
              break;
            case 'PAYMENT_ISSUED':
              stats.paymentIssued++;
              break;
            default:
              stats.unknown++;
          }
        }
      });

      stats.averageConfidence = emails.length > 0 ? totalConfidence / emails.length : 0;

      return stats;
    }),

  // Manually review and confirm parsed response
  confirmParsedResponse: protectedProcedure
    .input(z.object({
      emailId: z.number(),
      confirmedResponseType: z.enum(['APPROVED', 'DENIED', 'PENDING', 'REQUIRES_INFO', 'PAYMENT_ISSUED', 'UNKNOWN']),
      confirmedStatus: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get email
      const emailResult = await db
        .select()
        .from(emailCommunications)
        .where(eq(emailCommunications.id, input.emailId))
        .limit(1);

      if (emailResult.length === 0) {
        throw new Error('Email not found');
      }

      const email = emailResult[0];

      // Update case with confirmed data
      if (email.caseId) {
        await db
          .update(cases)
          .set({ status: input.confirmedStatus })
          .where(eq(cases.id, email.caseId));
      }

      // Update email with confirmation
      const parsedData = email.aiParsedData ? JSON.parse(email.aiParsedData) : {};
      parsedData.confirmedResponseType = input.confirmedResponseType;
      parsedData.confirmedStatus = input.confirmedStatus;
      parsedData.reviewNotes = input.notes;
      parsedData.reviewedAt = new Date().toISOString();

      await db
        .update(emailCommunications)
        .set({
          aiParsedData: JSON.stringify(parsedData),
        })
        .where(eq(emailCommunications.id, input.emailId));

      return { success: true };
    }),

  // Detect payment notification
  detectPayment: protectedProcedure
    .input(z.object({
      emailContent: z.string(),
    }))
    .query(async ({ input }) => {
      const result = await carrierResponseParser.detectPaymentNotification(input.emailContent);
      return result;
    }),
});
