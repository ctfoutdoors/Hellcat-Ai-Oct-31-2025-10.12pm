import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { paymentReconciliation } from '../services/PaymentReconciliation';
import { getDb } from '../db';
import {
  paymentRecords,
  bankTransactions,
  paymentMatchingSuggestions,
} from '../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

export const paymentReconciliationRouter = router({
  // Import bank transactions
  importTransactions: protectedProcedure
    .input(z.object({
      transactions: z.array(z.object({
        date: z.string(),
        amount: z.number(),
        description: z.string(),
        type: z.string().optional(),
        accountId: z.string().optional(),
        transactionId: z.string(),
        checkNumber: z.string().optional(),
        category: z.string().optional(),
      })),
      batchId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const count = await paymentReconciliation.importBankTransactions(
        input.transactions,
        input.batchId
      );
      return { success: true, importedCount: count };
    }),

  // Create payment record
  createPaymentRecord: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      paymentAmount: z.number(),
      paymentMethod: z.enum(['CHECK', 'ACH', 'CREDIT', 'WIRE', 'OTHER']),
      paymentDate: z.string(),
      checkNumber: z.string().optional(),
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL', 'OTHER']).optional(),
      carrierReference: z.string().optional(),
      bankTransactionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const paymentRecordId = await paymentReconciliation.createPaymentRecord({
        ...input,
        paymentDate: new Date(input.paymentDate),
      });
      return { success: true, paymentRecordId };
    }),

  // Get all payment records
  getPaymentRecords: protectedProcedure
    .input(z.object({
      status: z.enum(['UNMATCHED', 'MATCHED', 'DISPUTED', 'VERIFIED']).optional(),
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL', 'OTHER']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(paymentRecords).orderBy(desc(paymentRecords.paymentDate));

      if (input.status) {
        query = query.where(eq(paymentRecords.reconciliationStatus, input.status)) as any;
      }

      if (input.carrier) {
        query = query.where(eq(paymentRecords.carrier, input.carrier)) as any;
      }

      const records = await query;

      return records.map(r => ({
        ...r,
        paymentAmount: r.paymentAmount / 100, // Convert back to dollars
        expectedAmount: r.expectedAmount ? r.expectedAmount / 100 : null,
        discrepancyAmount: r.discrepancyAmount ? r.discrepancyAmount / 100 : null,
      }));
    }),

  // Get bank transactions
  getBankTransactions: protectedProcedure
    .input(z.object({
      isReconciled: z.boolean().optional(),
      isCarrierPayment: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(bankTransactions).orderBy(desc(bankTransactions.transactionDate));

      if (input.isReconciled !== undefined) {
        query = query.where(eq(bankTransactions.isReconciled, input.isReconciled)) as any;
      }

      if (input.isCarrierPayment !== undefined) {
        query = query.where(eq(bankTransactions.isCarrierPayment, input.isCarrierPayment)) as any;
      }

      const transactions = await query;

      return transactions.map(t => ({
        ...t,
        amount: t.amount / 100, // Convert back to dollars
      }));
    }),

  // Find matching cases for a payment
  findMatches: protectedProcedure
    .input(z.object({
      paymentRecordId: z.number(),
    }))
    .query(async ({ input }) => {
      const matches = await paymentReconciliation.findMatchingCases(input.paymentRecordId);
      return matches;
    }),

  // Get matching suggestions
  getMatchingSuggestions: protectedProcedure
    .input(z.object({
      paymentRecordId: z.number().optional(),
      status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db
        .select()
        .from(paymentMatchingSuggestions)
        .orderBy(desc(paymentMatchingSuggestions.confidence));

      if (input.paymentRecordId) {
        query = query.where(eq(paymentMatchingSuggestions.paymentRecordId, input.paymentRecordId)) as any;
      }

      if (input.status) {
        query = query.where(eq(paymentMatchingSuggestions.status, input.status)) as any;
      }

      const suggestions = await query;

      return suggestions.map(s => ({
        ...s,
        matchDetails: s.matchDetails ? JSON.parse(s.matchDetails) : null,
      }));
    }),

  // Auto-match payments
  autoMatch: protectedProcedure
    .mutation(async () => {
      const matchedCount = await paymentReconciliation.autoMatchPayments();
      return { success: true, matchedCount };
    }),

  // Confirm a match
  confirmMatch: protectedProcedure
    .input(z.object({
      paymentRecordId: z.number(),
      caseId: z.number(),
      method: z.enum(['AUTO', 'MANUAL', 'AI_SUGGESTED']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await paymentReconciliation.confirmMatch(
        input.paymentRecordId,
        input.caseId,
        ctx.user.id,
        input.method || 'MANUAL'
      );
      return { success: true };
    }),

  // Reject a match suggestion
  rejectMatch: protectedProcedure
    .input(z.object({
      suggestionId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(paymentMatchingSuggestions)
        .set({
          status: 'REJECTED',
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reason,
        })
        .where(eq(paymentMatchingSuggestions.id, input.suggestionId));

      return { success: true };
    }),

  // Get reconciliation statistics
  getStats: protectedProcedure
    .query(async () => {
      const stats = await paymentReconciliation.getReconciliationStats();
      return stats;
    }),

  // Get unmatched payments
  getUnmatchedPayments: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const unmatched = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.reconciliationStatus, 'UNMATCHED'))
        .orderBy(desc(paymentRecords.paymentDate));

      return unmatched.map(r => ({
        ...r,
        paymentAmount: r.paymentAmount / 100,
      }));
    }),
});
