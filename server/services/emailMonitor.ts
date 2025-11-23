import { google } from 'googleapis';
import { createCase } from '../db';

interface ParsedCaseData {
  carrier: string;
  trackingNumber?: string;
  claimAmount?: number;
  caseType: string;
  title: string;
  description: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: Date;
}

/**
 * Gmail Email Monitor Service
 * Monitors Gmail inbox for carrier dispute emails and automatically creates cases
 * Uses OAuth2 for authentication (no passwords needed)
 */
export class GmailMonitorService {
  private gmail: any;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private lastCheckTime: Date;

  constructor(private accessToken: string) {
    // Initialize Gmail API client with OAuth2
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.gmail = google.gmail({ version: 'v1', auth });
    this.lastCheckTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Start from 24h ago
  }

  /**
   * Start the email monitoring service
   */
  public start(intervalMinutes: number = 5): void {
    console.log('[GmailMonitor] Starting Gmail monitoring service...');
    console.log(`[GmailMonitor] Polling interval: ${intervalMinutes} minutes`);
    
    // Initial check
    this.checkForNewEmails();
    
    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.checkForNewEmails();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the email monitoring service
   */
  public stop(): void {
    console.log('[GmailMonitor] Stopping Gmail monitoring service...');
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Check for new emails in Gmail
   */
  private async checkForNewEmails(): Promise<void> {
    if (this.isProcessing) {
      console.log('[GmailMonitor] Already processing emails, skipping this cycle');
      return;
    }

    this.isProcessing = true;
    console.log('[GmailMonitor] Checking for new emails...');

    try {
      // Search for unread emails from carriers
      const query = [
        'is:unread',
        '(from:fedex.com OR from:ups.com OR from:usps.com OR from:dhl.com)',
        `after:${Math.floor(this.lastCheckTime.getTime() / 1000)}`,
      ].join(' ');

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      });

      const messages = response.data.messages || [];
      console.log(`[GmailMonitor] Found ${messages.length} new emails`);

      if (messages.length === 0) {
        this.lastCheckTime = new Date();
        return;
      }

      // Process each message
      for (const message of messages) {
        try {
          await this.processMessage(message.id);
        } catch (error) {
          console.error(`[GmailMonitor] Error processing message ${message.id}:`, error);
        }
      }

      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('[GmailMonitor] Error checking emails:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single Gmail message
   */
  private async processMessage(messageId: string): Promise<void> {
    try {
      // Get full message details
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      
      // Extract email data
      const headers = message.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Get email body
      let body = '';
      if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload.parts) {
        // Multi-part message, find text/plain part
        const textPart = message.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      console.log(`[GmailMonitor] Processing: ${subject}`);

      // Parse case data
      const caseData = this.extractCaseData(subject, body, from, new Date(date));

      if (!caseData) {
        console.log('[GmailMonitor] Email does not appear to be a carrier dispute, marking as read');
        // Mark as read so we don't process it again
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
        return;
      }

      // Create case
      const newCase = await createCase({
        title: caseData.title,
        description: caseData.description,
        carrier: caseData.carrier,
        caseType: caseData.caseType,
        trackingNumber: caseData.trackingNumber,
        claimAmount: caseData.claimAmount,
        status: 'draft', // Set to draft for manual review
        priority: 'medium',
        createdBy: 1, // System user
      });

      console.log(`[GmailMonitor] Created case ${newCase.caseNumber} from email`);

      // Mark email as read and add label
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
          addLabelIds: ['INBOX'], // Keep in inbox but mark as processed
        },
      });

      // TODO: Attach email as evidence
      // TODO: Log activity for email-created case

    } catch (error) {
      console.error('[GmailMonitor] Error processing message:', error);
      throw error;
    }
  }

  /**
   * Extract case data from email content
   */
  private extractCaseData(
    subject: string,
    body: string,
    from: string,
    date: Date
  ): ParsedCaseData | null {
    // Detect carrier
    const carrier = this.detectCarrier(from, subject, body);
    if (!carrier) {
      return null;
    }

    // Extract tracking number
    const trackingNumber = this.extractTrackingNumber(body, carrier);

    // Extract claim amount
    const claimAmount = this.extractClaimAmount(body);

    // Detect case type
    const caseType = this.detectCaseType(subject, body);

    // Build title and description
    const title = this.buildTitle(carrier, caseType, trackingNumber);
    const description = this.buildDescription(subject, body, from, date, trackingNumber, claimAmount);

    return {
      carrier,
      trackingNumber,
      claimAmount,
      caseType,
      title,
      description,
      emailSubject: subject,
      emailFrom: from,
      emailDate: date,
    };
  }

  /**
   * Detect carrier from email sender or content
   */
  private detectCarrier(from: string, subject: string, body: string): string | null {
    const content = `${from} ${subject} ${body}`.toLowerCase();

    if (content.includes('fedex')) return 'FEDEX';
    if (content.includes('ups')) return 'UPS';
    if (content.includes('usps') || content.includes('postal')) return 'USPS';
    if (content.includes('dhl')) return 'DHL';

    return null;
  }

  /**
   * Extract tracking number from email text
   */
  private extractTrackingNumber(text: string, carrier: string): string | undefined {
    // FedEx: 12-14 digits
    if (carrier === 'FEDEX') {
      const match = text.match(/\b\d{12,14}\b/);
      return match ? match[0] : undefined;
    }

    // UPS: 1Z followed by 16 characters
    if (carrier === 'UPS') {
      const match = text.match(/\b1Z[A-Z0-9]{16}\b/i);
      return match ? match[0] : undefined;
    }

    // USPS: 20-22 digits
    if (carrier === 'USPS') {
      const match = text.match(/\b\d{20,22}\b/);
      return match ? match[0] : undefined;
    }

    return undefined;
  }

  /**
   * Extract claim amount from email text
   */
  private extractClaimAmount(text: string): number | undefined {
    const patterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 100000) {
          return amount;
        }
      }
    }

    return undefined;
  }

  /**
   * Detect case type from email content
   */
  private detectCaseType(subject: string, text: string): string {
    const content = `${subject} ${text}`.toLowerCase();

    if (content.includes('damage') || content.includes('damaged')) return 'DAMAGE';
    if (content.includes('lost') || content.includes('missing')) return 'LOST';
    if (content.includes('late') || content.includes('delay')) return 'LATE_DELIVERY';
    if (content.includes('billing') || content.includes('charge') || content.includes('invoice')) return 'ADJUSTMENTS';

    return 'OTHER';
  }

  /**
   * Build case title
   */
  private buildTitle(carrier: string, caseType: string, trackingNumber?: string): string {
    const typeLabel = caseType.replace(/_/g, ' ').toLowerCase();
    const tracking = trackingNumber ? ` - Tracking ${trackingNumber}` : '';
    return `${carrier} ${typeLabel}${tracking}`;
  }

  /**
   * Build case description from email
   */
  private buildDescription(
    subject: string,
    body: string,
    from: string,
    date: Date,
    trackingNumber?: string,
    claimAmount?: number
  ): string {
    const parts = [
      `Auto-created from email received on ${date.toLocaleString()}`,
      `From: ${from}`,
      `Subject: ${subject}`,
      '',
      '--- Original Email Content ---',
      body,
    ];

    if (trackingNumber) {
      parts.splice(3, 0, `Tracking: ${trackingNumber}`);
    }

    if (claimAmount) {
      parts.splice(3, 0, `Claim Amount: $${claimAmount.toFixed(2)}`);
    }

    return parts.join('\n');
  }
}

/**
 * Create and start Gmail monitor service if configured
 */
export function startEmailMonitor(): GmailMonitorService | null {
  const accessToken = process.env.GMAIL_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('[GmailMonitor] Gmail monitoring not configured (missing GMAIL_ACCESS_TOKEN)');
    console.log('[GmailMonitor] To enable: Set GMAIL_ACCESS_TOKEN environment variable with a valid OAuth2 access token');
    return null;
  }

  try {
    const monitor = new GmailMonitorService(accessToken);
    monitor.start(parseInt(process.env.EMAIL_POLL_INTERVAL || '5'));
    return monitor;
  } catch (error) {
    console.error('[GmailMonitor] Failed to start Gmail monitoring:', error);
    return null;
  }
}
