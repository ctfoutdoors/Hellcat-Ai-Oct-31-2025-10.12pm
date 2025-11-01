import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { carrierPortalAutomation } from '../services/CarrierPortalAutomation';
import { getDb } from '../db';
import { 
  carrierPortalCredentials,
  portalSubmissionQueue,
  portalSubmissionHistory,
  carrierPortalConfigs
} from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const portalAutomationRouter = router({
  // Store new portal credentials
  storeCredentials: protectedProcedure
    .input(z.object({
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL']),
      accountName: z.string(),
      username: z.string(),
      password: z.string(),
      accountNumber: z.string().optional(),
      twoFactorMethod: z.enum(['NONE', 'SMS', 'EMAIL', 'AUTHENTICATOR']).optional(),
      twoFactorPhone: z.string().optional(),
      twoFactorEmail: z.string().optional(),
      isShared: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await carrierPortalAutomation.storeCredentials({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true, message: 'Credentials stored successfully' };
    }),

  // Get all credentials for a carrier
  getCredentials: protectedProcedure
    .input(z.object({
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select({
        id: carrierPortalCredentials.id,
        carrier: carrierPortalCredentials.carrier,
        accountName: carrierPortalCredentials.accountName,
        isActive: carrierPortalCredentials.isActive,
        isShared: carrierPortalCredentials.isShared,
        lastUsed: carrierPortalCredentials.lastUsed,
        lastValidated: carrierPortalCredentials.lastValidated,
        validationStatus: carrierPortalCredentials.validationStatus,
        twoFactorMethod: carrierPortalCredentials.twoFactorMethod,
        createdAt: carrierPortalCredentials.createdAt,
      }).from(carrierPortalCredentials);

      if (input.carrier) {
        query = query.where(eq(carrierPortalCredentials.carrier, input.carrier)) as any;
      }

      const credentials = await query;
      return credentials;
    }),

  // Test portal credentials
  testCredentials: protectedProcedure
    .input(z.object({
      credentialId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const result = await carrierPortalAutomation.testCredentials(input.credentialId);
      return result;
    }),

  // Delete credentials
  deleteCredentials: protectedProcedure
    .input(z.object({
      credentialId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .delete(carrierPortalCredentials)
        .where(eq(carrierPortalCredentials.id, input.credentialId));

      return { success: true, message: 'Credentials deleted successfully' };
    }),

  // Queue a case for submission
  queueSubmission: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL']),
      credentialId: z.number(),
      submissionType: z.enum(['NEW_CLAIM', 'APPEAL', 'FOLLOW_UP', 'DOCUMENT_UPLOAD']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      scheduledFor: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await carrierPortalAutomation.queueSubmission({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true, message: 'Submission queued successfully' };
    }),

  // Get submission queue
  getSubmissionQueue: protectedProcedure
    .input(z.object({
      status: z.enum(['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'NEEDS_CAPTCHA', 'NEEDS_2FA']).optional(),
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(portalSubmissionQueue).orderBy(desc(portalSubmissionQueue.createdAt));

      if (input.status) {
        query = query.where(eq(portalSubmissionQueue.status, input.status)) as any;
      }

      if (input.carrier) {
        query = query.where(eq(portalSubmissionQueue.carrier, input.carrier)) as any;
      }

      const submissions = await query;
      return submissions;
    }),

  // Get submission history for a case
  getSubmissionHistory: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      submissionId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(portalSubmissionHistory).orderBy(desc(portalSubmissionHistory.createdAt));

      if (input.caseId) {
        query = query.where(eq(portalSubmissionHistory.caseId, input.caseId)) as any;
      }

      if (input.submissionId) {
        query = query.where(eq(portalSubmissionHistory.submissionId, input.submissionId)) as any;
      }

      const history = await query;
      return history;
    }),

  // Cancel a queued submission
  cancelSubmission: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(portalSubmissionQueue)
        .set({ status: 'CANCELLED' })
        .where(eq(portalSubmissionQueue.id, input.submissionId));

      return { success: true, message: 'Submission cancelled' };
    }),

  // Retry a failed submission
  retrySubmission: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(portalSubmissionQueue)
        .set({ 
          status: 'QUEUED',
          attemptCount: 0,
          errorMessage: null,
          errorDetails: null,
          nextAttemptAt: new Date(),
        })
        .where(eq(portalSubmissionQueue.id, input.submissionId));

      return { success: true, message: 'Submission queued for retry' };
    }),

  // Get portal configurations
  getPortalConfigs: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const configs = await db.select().from(carrierPortalConfigs);
      return configs;
    }),

  // Update portal configuration
  updatePortalConfig: protectedProcedure
    .input(z.object({
      carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL']),
      loginUrl: z.string().optional(),
      claimsUrl: z.string().optional(),
      trackingUrl: z.string().optional(),
      loginSelectors: z.any().optional(),
      claimFormSelectors: z.any().optional(),
      maxConcurrentSessions: z.number().optional(),
      sessionTimeout: z.number().optional(),
      hasCaptcha: z.boolean().optional(),
      captchaType: z.enum(['NONE', 'RECAPTCHA_V2', 'RECAPTCHA_V3', 'HCAPTCHA', 'IMAGE']).optional(),
      isEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { carrier, ...updates } = input;

      // Convert objects to JSON strings
      const updateData: any = { ...updates };
      if (updates.loginSelectors) {
        updateData.loginSelectors = JSON.stringify(updates.loginSelectors);
      }
      if (updates.claimFormSelectors) {
        updateData.claimFormSelectors = JSON.stringify(updates.claimFormSelectors);
      }

      await db
        .update(carrierPortalConfigs)
        .set(updateData)
        .where(eq(carrierPortalConfigs.carrier, carrier));

      return { success: true, message: 'Portal configuration updated' };
    }),

  // Initialize default portal configurations
  initializePortalConfigs: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const defaultConfigs = [
        {
          carrier: 'FEDEX' as const,
          loginUrl: 'https://www.fedex.com/en-us/login.html',
          claimsUrl: 'https://www.fedex.com/fcl/web/jsp/claimsHome.jsp',
          trackingUrl: 'https://www.fedex.com/fedextrack/',
          loginSelectors: JSON.stringify({
            username: '#userId',
            password: '#password',
            submit: 'button[type="submit"]',
          }),
          claimFormSelectors: JSON.stringify({
            trackingNumber: '#trackingNumber',
            claimAmount: '#claimAmount',
            description: '#description',
            submit: '#submitClaim',
          }),
          hasCaptcha: false,
          isEnabled: true,
        },
        {
          carrier: 'UPS' as const,
          loginUrl: 'https://www.ups.com/lasso/login',
          claimsUrl: 'https://www.ups.com/claims',
          trackingUrl: 'https://www.ups.com/track',
          loginSelectors: JSON.stringify({
            username: '#userid',
            password: '#pwd',
            submit: '#submitBtn',
          }),
          claimFormSelectors: JSON.stringify({
            trackingNumber: '#tracking',
            claimAmount: '#amount',
            description: '#desc',
            submit: '#submit',
          }),
          hasCaptcha: true,
          captchaType: 'RECAPTCHA_V2' as const,
          isEnabled: true,
        },
        {
          carrier: 'USPS' as const,
          loginUrl: 'https://reg.usps.com/entreg/LoginAction_input',
          claimsUrl: 'https://www.usps.com/help/claims.htm',
          trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction',
          loginSelectors: JSON.stringify({
            username: '#username',
            password: '#password',
            submit: '#btn-submit',
          }),
          claimFormSelectors: JSON.stringify({
            trackingNumber: '#trackingNum',
            claimAmount: '#claimAmt',
            description: '#claimDesc',
            submit: '#submitBtn',
          }),
          hasCaptcha: false,
          isEnabled: true,
        },
        {
          carrier: 'DHL' as const,
          loginUrl: 'https://www.dhl.com/us-en/home/login.html',
          claimsUrl: 'https://www.dhl.com/us-en/home/claims.html',
          trackingUrl: 'https://www.dhl.com/us-en/home/tracking.html',
          loginSelectors: JSON.stringify({
            username: '#username',
            password: '#password',
            submit: 'button.login-btn',
          }),
          claimFormSelectors: JSON.stringify({
            trackingNumber: '#waybill',
            claimAmount: '#amount',
            description: '#reason',
            submit: '#submit-claim',
          }),
          hasCaptcha: false,
          isEnabled: true,
        },
      ];

      for (const config of defaultConfigs) {
        // Check if config already exists
        const existing = await db
          .select()
          .from(carrierPortalConfigs)
          .where(eq(carrierPortalConfigs.carrier, config.carrier))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(carrierPortalConfigs).values(config);
        }
      }

      return { success: true, message: 'Portal configurations initialized' };
    }),

  // Process submission queue (called by cron job)
  processQueue: protectedProcedure
    .mutation(async () => {
      const result = await carrierPortalAutomation.processQueue();
      
      if (!result) {
        return { success: true, message: 'No submissions in queue' };
      }

      return { 
        success: result.success, 
        message: result.success ? 'Submission processed successfully' : result.errorMessage,
        result,
      };
    }),
});
