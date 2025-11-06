import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { getDb } from '../db';
import { 
  carrierPortalCredentials, 
  portalSubmissionQueue, 
  portalSubmissionHistory,
  portalSessions,
  carrierPortalConfigs,
  cases
} from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Encryption utilities for credentials
const ENCRYPTION_KEY = process.env.PORTAL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

interface SubmissionResult {
  success: boolean;
  confirmationNumber?: string;
  claimNumber?: string;
  screenshotUrl?: string;
  errorMessage?: string;
  errorDetails?: any;
}

interface PortalCredentials {
  username: string;
  password: string;
  accountNumber?: string;
}

export class CarrierPortalAutomationService {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async shutdown() {
    // Close all contexts
    for (const context of this.contexts.values()) {
      await context.close();
    }
    this.contexts.clear();

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Store encrypted portal credentials
   */
  async storeCredentials(data: {
    carrier: 'FEDEX' | 'UPS' | 'USPS' | 'DHL';
    accountName: string;
    username: string;
    password: string;
    accountNumber?: string;
    securityQuestions?: any;
    twoFactorMethod?: 'NONE' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR';
    twoFactorPhone?: string;
    twoFactorEmail?: string;
    isShared?: boolean;
    createdBy: number;
  }) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const encrypted = {
      carrier: data.carrier,
      accountName: data.accountName,
      username: encrypt(data.username),
      password: encrypt(data.password),
      accountNumber: data.accountNumber ? encrypt(data.accountNumber) : null,
      securityQuestions: data.securityQuestions ? encrypt(JSON.stringify(data.securityQuestions)) : null,
      twoFactorMethod: data.twoFactorMethod || 'NONE',
      twoFactorPhone: data.twoFactorPhone ? encrypt(data.twoFactorPhone) : null,
      twoFactorEmail: data.twoFactorEmail ? encrypt(data.twoFactorEmail) : null,
      isShared: data.isShared || false,
      createdBy: data.createdBy,
      validationStatus: 'NEEDS_VERIFICATION' as const,
    };

    const result = await db.insert(carrierPortalCredentials).values(encrypted);
    return result;
  }

  /**
   * Retrieve and decrypt portal credentials
   */
  async getCredentials(credentialId: number): Promise<PortalCredentials | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db
      .select()
      .from(carrierPortalCredentials)
      .where(eq(carrierPortalCredentials.id, credentialId))
      .limit(1);

    if (result.length === 0) return null;

    const cred = result[0];
    return {
      username: decrypt(cred.username),
      password: decrypt(cred.password),
      accountNumber: cred.accountNumber ? decrypt(cred.accountNumber) : undefined,
    };
  }

  /**
   * Queue a case for automated portal submission
   */
  async queueSubmission(data: {
    caseId: number;
    carrier: 'FEDEX' | 'UPS' | 'USPS' | 'DHL';
    credentialId: number;
    submissionType?: 'NEW_CLAIM' | 'APPEAL' | 'FOLLOW_UP' | 'DOCUMENT_UPLOAD';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    scheduledFor?: Date;
    createdBy: number;
  }) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get case data to populate form
    const caseData = await db
      .select()
      .from(cases)
      .where(eq(cases.id, data.caseId))
      .limit(1);

    if (caseData.length === 0) {
      throw new Error(`Case ${data.caseId} not found`);
    }

    const caseRecord = caseData[0];

    // Build form data from case
    const formData = {
      trackingNumber: caseRecord.trackingId,
      claimType: caseRecord.caseType,
      claimAmount: caseRecord.claimedAmount / 100, // Convert cents to dollars
      customerName: caseRecord.customerName,
      recipientEmail: caseRecord.recipientEmail,
      recipientPhone: caseRecord.recipientPhone,
      damageDescription: caseRecord.damageDescription,
      adjustmentReason: caseRecord.adjustmentReason,
      // Add more fields as needed
    };

    const submission = {
      caseId: data.caseId,
      carrier: data.carrier,
      credentialId: data.credentialId,
      submissionType: data.submissionType || 'NEW_CLAIM',
      priority: data.priority || 'MEDIUM',
      formData: JSON.stringify(formData),
      scheduledFor: data.scheduledFor || new Date(),
      createdBy: data.createdBy,
      status: 'QUEUED' as const,
    };

    const result = await db.insert(portalSubmissionQueue).values(submission);
    return result;
  }

  /**
   * Process queued submissions
   */
  async processQueue() {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get next queued submission
    const queued = await db
      .select()
      .from(portalSubmissionQueue)
      .where(eq(portalSubmissionQueue.status, 'QUEUED'))
      .orderBy(portalSubmissionQueue.priority, portalSubmissionQueue.scheduledFor)
      .limit(1);

    if (queued.length === 0) {
      return null; // No submissions in queue
    }

    const submission = queued[0];

    // Update status to IN_PROGRESS
    await db
      .update(portalSubmissionQueue)
      .set({ 
        status: 'IN_PROGRESS', 
        startedAt: new Date(),
        attemptCount: submission.attemptCount + 1,
        lastAttemptAt: new Date()
      })
      .where(eq(portalSubmissionQueue.id, submission.id));

    try {
      // Execute submission
      const result = await this.submitToPortal(submission);

      // Update submission with result
      if (result.success) {
        await db
          .update(portalSubmissionQueue)
          .set({
            status: 'COMPLETED',
            completedAt: new Date(),
            confirmationNumber: result.confirmationNumber,
            claimNumber: result.claimNumber,
            screenshotUrl: result.screenshotUrl,
          })
          .where(eq(portalSubmissionQueue.id, submission.id));

        // Update case status
        await db
          .update(cases)
          .set({
            status: 'FILED',
            carrierGuaranteeClaimNumber: result.claimNumber,
          })
          .where(eq(cases.id, submission.caseId));
      } else {
        // Check if we should retry
        const shouldRetry = submission.attemptCount < submission.maxAttempts;
        
        await db
          .update(portalSubmissionQueue)
          .set({
            status: shouldRetry ? 'QUEUED' : 'FAILED',
            errorMessage: result.errorMessage,
            errorDetails: JSON.stringify(result.errorDetails),
            nextAttemptAt: shouldRetry ? new Date(Date.now() + 5 * 60 * 1000) : null, // Retry in 5 minutes
          })
          .where(eq(portalSubmissionQueue.id, submission.id));
      }

      return result;
    } catch (error: any) {
      console.error('Error processing submission:', error);
      
      await db
        .update(portalSubmissionQueue)
        .set({
          status: 'FAILED',
          errorMessage: error.message,
          errorDetails: JSON.stringify({ stack: error.stack }),
        })
        .where(eq(portalSubmissionQueue.id, submission.id));

      return {
        success: false,
        errorMessage: error.message,
        errorDetails: error,
      };
    }
  }

  /**
   * Submit a case to carrier portal (main automation logic)
   */
  private async submitToPortal(submission: any): Promise<SubmissionResult> {
    await this.initialize();

    const startTime = Date.now();
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    try {
      // Get credentials
      const credentials = await this.getCredentials(submission.credentialId);
      if (!credentials) {
        throw new Error('Credentials not found');
      }

      // Get portal configuration
      const configResult = await db
        .select()
        .from(carrierPortalConfigs)
        .where(eq(carrierPortalConfigs.carrier, submission.carrier))
        .limit(1);

      if (configResult.length === 0) {
        throw new Error(`Portal configuration not found for ${submission.carrier}`);
      }

      const config = configResult[0];

      // Create browser context
      const context = await this.browser!.createNewContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      const page = await context.newPage();

      // Log action
      await this.logAction(submission.id, submission.caseId, submission.carrier, 'NAVIGATE', 'SUCCESS', `Navigating to ${config.loginUrl}`);

      // Navigate to login page
      await page.goto(config.loginUrl);

      // Parse login selectors
      const loginSelectors = config.loginSelectors ? JSON.parse(config.loginSelectors) : {};

      // Fill login form
      await this.logAction(submission.id, submission.caseId, submission.carrier, 'LOGIN', 'SUCCESS', 'Filling login form');
      
      await page.fill(loginSelectors.username || '#username', credentials.username);
      await page.fill(loginSelectors.password || '#password', credentials.password);

      // Take screenshot before submit
      const loginScreenshot = await page.screenshot({ fullPage: true });
      
      // Click login button
      await page.click(loginSelectors.submit || 'button[type="submit"]');

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Check if login was successful (carrier-specific logic)
      const loginSuccess = await this.verifyLogin(page, submission.carrier);
      
      if (!loginSuccess) {
        await context.close();
        return {
          success: false,
          errorMessage: 'Login failed - invalid credentials or security challenge',
        };
      }

      await this.logAction(submission.id, submission.caseId, submission.carrier, 'LOGIN', 'SUCCESS', 'Login successful');

      // Navigate to claims page
      if (config.claimsUrl) {
        await page.goto(config.claimsUrl);
        await page.waitForLoadState('networkidle');
      }

      // Fill claim form (carrier-specific)
      const formData = JSON.parse(submission.formData || '{}');
      const claimResult = await this.fillClaimForm(page, submission.carrier, formData, config);

      if (!claimResult.success) {
        await context.close();
        return claimResult;
      }

      // Take final screenshot
      const confirmationScreenshot = await page.screenshot({ fullPage: true });
      
      // TODO: Upload screenshot to S3 and get URL
      const screenshotUrl = 'https://placeholder.com/screenshot.png';

      // Close context
      await context.close();

      const duration = Date.now() - startTime;

      await this.logAction(submission.id, submission.caseId, submission.carrier, 'SUBMIT', 'SUCCESS', `Submission completed in ${duration}ms`);

      return {
        success: true,
        confirmationNumber: claimResult.confirmationNumber,
        claimNumber: claimResult.claimNumber,
        screenshotUrl,
      };

    } catch (error: any) {
      console.error('Portal submission error:', error);
      
      await this.logAction(submission.id, submission.caseId, submission.carrier, 'ERROR', 'FAILED', error.message);

      return {
        success: false,
        errorMessage: error.message,
        errorDetails: { stack: error.stack },
      };
    }
  }

  /**
   * Verify login success (carrier-specific)
   */
  private async verifyLogin(page: Page, carrier: string): Promise<boolean> {
    try {
      // Carrier-specific verification logic
      switch (carrier) {
        case 'FEDEX':
          // Check for FedEx dashboard elements
          return await page.locator('[data-testid="dashboard"]').isVisible({ timeout: 5000 })
            .catch(() => false);
        
        case 'UPS':
          // Check for UPS account menu
          return await page.locator('#accountMenu').isVisible({ timeout: 5000 })
            .catch(() => false);
        
        case 'USPS':
          // Check for USPS navigation
          return await page.locator('.main-navigation').isVisible({ timeout: 5000 })
            .catch(() => false);
        
        case 'DHL':
          // Check for DHL header
          return await page.locator('.dhl-header').isVisible({ timeout: 5000 })
            .catch(() => false);
        
        default:
          // Generic check - look for logout button
          return await page.locator('text=Logout').isVisible({ timeout: 5000 })
            .catch(() => false);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Fill claim form (carrier-specific)
   */
  private async fillClaimForm(page: Page, carrier: string, formData: any, config: any): Promise<SubmissionResult> {
    try {
      const selectors = config.claimFormSelectors ? JSON.parse(config.claimFormSelectors) : {};

      // Generic form filling (customize per carrier)
      if (selectors.trackingNumber) {
        await page.fill(selectors.trackingNumber, formData.trackingNumber || '');
      }

      if (selectors.claimAmount) {
        await page.fill(selectors.claimAmount, formData.claimAmount?.toString() || '0');
      }

      if (selectors.description) {
        await page.fill(selectors.description, formData.damageDescription || formData.adjustmentReason || '');
      }

      // Click submit
      if (selectors.submit) {
        await page.click(selectors.submit);
        await page.waitForLoadState('networkidle');
      }

      // Extract confirmation number (carrier-specific)
      const confirmationNumber = await this.extractConfirmationNumber(page, carrier);

      return {
        success: true,
        confirmationNumber,
        claimNumber: confirmationNumber, // May be different for some carriers
      };

    } catch (error: any) {
      return {
        success: false,
        errorMessage: `Failed to fill claim form: ${error.message}`,
      };
    }
  }

  /**
   * Extract confirmation number from confirmation page
   */
  private async extractConfirmationNumber(page: Page, carrier: string): Promise<string | undefined> {
    try {
      // Carrier-specific extraction logic
      switch (carrier) {
        case 'FEDEX':
          return await page.locator('.confirmation-number').textContent() || undefined;
        
        case 'UPS':
          return await page.locator('#claimNumber').textContent() || undefined;
        
        case 'USPS':
          return await page.locator('.claim-id').textContent() || undefined;
        
        case 'DHL':
          return await page.locator('[data-claim-number]').getAttribute('data-claim-number') || undefined;
        
        default:
          // Generic extraction - look for patterns
          const pageText = await page.textContent('body') || '';
          const match = pageText.match(/(?:Confirmation|Claim|Reference)\s*(?:Number|#|ID):\s*([A-Z0-9-]+)/i);
          return match ? match[1] : undefined;
      }
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Log portal action to history
   */
  private async logAction(
    submissionId: number,
    caseId: number,
    carrier: string,
    action: string,
    status: 'SUCCESS' | 'FAILED' | 'WARNING',
    message: string
  ) {
    const db = await getDb();
    if (!db) return;

    try {
      await db.insert(portalSubmissionHistory).values({
        submissionId,
        caseId,
        carrier: carrier as any,
        action,
        status,
        message,
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }

  /**
   * Test portal credentials
   */
  async testCredentials(credentialId: number): Promise<{ success: boolean; message: string }> {
    await this.initialize();

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    try {
      const credentials = await this.getCredentials(credentialId);
      if (!credentials) {
        return { success: false, message: 'Credentials not found' };
      }

      // Get credential record to know which carrier
      const credRecord = await db
        .select()
        .from(carrierPortalCredentials)
        .where(eq(carrierPortalCredentials.id, credentialId))
        .limit(1);

      if (credRecord.length === 0) {
        return { success: false, message: 'Credential record not found' };
      }

      const carrier = credRecord[0].carrier;

      // Get portal config
      const configResult = await db
        .select()
        .from(carrierPortalConfigs)
        .where(eq(carrierPortalConfigs.carrier, carrier))
        .limit(1);

      if (configResult.length === 0) {
        return { success: false, message: `Portal configuration not found for ${carrier}` };
      }

      const config = configResult[0];

      // Create browser context
      const context = await this.browser!.createNewContext();
      const page = await context.newPage();

      // Navigate and login
      await page.goto(config.loginUrl);
      
      const loginSelectors = config.loginSelectors ? JSON.parse(config.loginSelectors) : {};
      await page.fill(loginSelectors.username || '#username', credentials.username);
      await page.fill(loginSelectors.password || '#password', credentials.password);
      await page.click(loginSelectors.submit || 'button[type="submit"]');
      
      await page.waitForLoadState('networkidle');

      // Verify login
      const loginSuccess = await this.verifyLogin(page, carrier);

      await context.close();

      // Update credential validation status
      await db
        .update(carrierPortalCredentials)
        .set({
          validationStatus: loginSuccess ? 'VALID' : 'INVALID',
          lastValidated: new Date(),
        })
        .where(eq(carrierPortalCredentials.id, credentialId));

      return {
        success: loginSuccess,
        message: loginSuccess ? 'Credentials validated successfully' : 'Login failed - credentials may be invalid',
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }
}

// Singleton instance
export const carrierPortalAutomation = new CarrierPortalAutomationService();
