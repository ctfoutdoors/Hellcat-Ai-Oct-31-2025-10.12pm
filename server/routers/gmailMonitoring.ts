import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { gmailMonitor } from '../services/gmailMonitoring';
import { getDb } from '../db';
import { emailCommunications, cases } from '../../drizzle/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';

export const gmailMonitoringRouter = router({
  
  /**
   * Start Gmail monitoring
   */
  start: protectedProcedure
    .input(z.object({
      pollIntervalMinutes: z.number().min(1).max(60).default(5),
    }))
    .mutation(async ({ input }) => {
      await gmailMonitor.start(input.pollIntervalMinutes);
      
      return {
        success: true,
        message: `Gmail monitoring started with ${input.pollIntervalMinutes}min interval`,
      };
    }),

  /**
   * Stop Gmail monitoring
   */
  stop: protectedProcedure
    .mutation(async () => {
      gmailMonitor.stop();
      
      return {
        success: true,
        message: 'Gmail monitoring stopped',
      };
    }),

  /**
   * Get monitoring status
   */
  getStatus: protectedProcedure
    .query(async () => {
      const status = gmailMonitor.getStatus();
      
      return {
        enabled: status.enabled,
        pollIntervalMinutes: status.pollIntervalMinutes,
        lastCheckedAt: status.lastCheckedAt,
      };
    }),

  /**
   * Get linked emails for a case
   */
  getLinkedEmails: protectedProcedure
    .input(z.object({
      caseId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const emails = await db
        .select()
        .from(emailCommunications)
        .where(eq(emailCommunications.caseId, input.caseId))
        .orderBy(desc(emailCommunications.receivedAt));

      return { emails };
    }),

  /**
   * Get unlinked emails (need manual review)
   */
  getUnlinkedEmails: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const offset = (input.page - 1) * input.pageSize;

      const emails = await db
        .select()
        .from(emailCommunications)
        .where(isNull(emailCommunications.caseId))
        .orderBy(desc(emailCommunications.receivedAt))
        .limit(input.pageSize)
        .offset(offset);

      return { emails };
    }),

  /**
   * Manually link email to case
   */
  linkEmail: protectedProcedure
    .input(z.object({
      emailId: z.number(),
      caseId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify case exists
      const caseRecord = await db.query.cases.findFirst({
        where: eq(cases.id, input.caseId),
      });

      if (!caseRecord) {
        throw new Error('Case not found');
      }

      // Update email
      await db
        .update(emailCommunications)
        .set({ caseId: input.caseId })
        .where(eq(emailCommunications.id, input.emailId));

      return {
        success: true,
        message: `Email linked to case ${caseRecord.caseNumber}`,
      };
    }),

  /**
   * Unlink email from case
   */
  unlinkEmail: protectedProcedure
    .input(z.object({
      emailId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(emailCommunications)
        .set({ caseId: null })
        .where(eq(emailCommunications.id, input.emailId));

      return {
        success: true,
        message: 'Email unlinked',
      };
    }),

  /**
   * Get monitoring statistics
   */
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Total emails
      const totalResult = await db
        .select({ count: db.$count() })
        .from(emailCommunications);

      // Linked emails
      const linkedResult = await db
        .select({ count: db.$count() })
        .from(emailCommunications)
        .where(and(
          eq(emailCommunications.caseId, emailCommunications.caseId),
          isNull(emailCommunications.caseId) === false as any
        ));

      // Unlinked emails
      const unlinkedResult = await db
        .select({ count: db.$count() })
        .from(emailCommunications)
        .where(isNull(emailCommunications.caseId));

      // By response type
      const byTypeResult = await db
        .select({
          responseType: emailCommunications.responseType,
          count: db.$count(),
        })
        .from(emailCommunications)
        .groupBy(emailCommunications.responseType);

      return {
        total: totalResult[0]?.count || 0,
        linked: linkedResult[0]?.count || 0,
        unlinked: unlinkedResult[0]?.count || 0,
        byType: byTypeResult.reduce((acc, row) => {
          acc[row.responseType || 'unknown'] = row.count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  /**
   * Force check inbox now (manual trigger)
   */
  checkNow: protectedProcedure
    .mutation(async () => {
      // Trigger immediate check by restarting with same config
      const status = gmailMonitor.getStatus();
      
      if (status.enabled) {
        gmailMonitor.stop();
        await gmailMonitor.start(status.pollIntervalMinutes);
      } else {
        // Start temporarily for one check
        await gmailMonitor.start(5);
        setTimeout(() => gmailMonitor.stop(), 10000); // Stop after 10 seconds
      }

      return {
        success: true,
        message: 'Inbox check triggered',
      };
    }),
});
