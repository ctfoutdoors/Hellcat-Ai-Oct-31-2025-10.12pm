/**
 * Gmail Monitoring Service
 * 
 * Polls Gmail inbox for carrier responses and automatically:
 * 1. Links emails to cases
 * 2. Updates case status
 * 3. Notifies users
 */

import { searchMessages, readThread } from './gmailService';
import { getDb } from '../db';
import { cases, emailCommunications } from '../../drizzle/schema';
import { eq, or, like, desc } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

interface MonitoringConfig {
  enabled: boolean;
  pollIntervalMinutes: number;
  lastCheckedAt?: Date;
}

interface EmailMatch {
  emailId: string;
  caseId: number;
  caseNumber: string;
  confidence: number;
  matchReason: string;
}

interface CarrierResponse {
  type: 'approved' | 'denied' | 'partial' | 'more_info_needed' | 'acknowledged' | 'unknown';
  confidence: number;
  extractedData: {
    approvedAmount?: number;
    denialReason?: string;
    requestedInfo?: string[];
    responseDate?: Date;
  };
}

class GmailMonitoringService {
  private config: MonitoringConfig = {
    enabled: false,
    pollIntervalMinutes: 5,
  };
  
  private pollingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Start monitoring Gmail inbox
   */
  async start(pollIntervalMinutes: number = 5): Promise<void> {
    if (this.pollingInterval) {
      console.log('[Gmail Monitor] Already running');
      return;
    }

    this.config.enabled = true;
    this.config.pollIntervalMinutes = pollIntervalMinutes;

    console.log(`[Gmail Monitor] Starting with ${pollIntervalMinutes}min interval`);

    // Initial check
    await this.checkInbox();

    // Set up polling
    this.pollingInterval = setInterval(
      () => this.checkInbox(),
      pollIntervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.config.enabled = false;
      console.log('[Gmail Monitor] Stopped');
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): MonitoringConfig {
    return {
      ...this.config,
      lastCheckedAt: this.config.lastCheckedAt,
    };
  }

  /**
   * Check inbox for new carrier responses
   */
  private async checkInbox(): Promise<void> {
    if (this.isProcessing) {
      console.log('[Gmail Monitor] Already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('[Gmail Monitor] Checking inbox...');

    try {
      // Search for carrier emails
      const carrierDomains = [
        'fedex.com',
        'ups.com',
        'usps.gov',
        'dhl.com',
        'shipstation.com',
        'lateshipment.com',
      ];

      const searchQuery = carrierDomains
        .map(domain => `from:${domain}`)
        .join(' OR ');

      // Get recent emails (last 7 days)
      const messages = await searchMessages({
        query: `${searchQuery} newer_than:7d`,
        maxResults: 50,
      });

      console.log(`[Gmail Monitor] Found ${messages.length} carrier emails`);

      // Process each message
      for (const message of messages) {
        await this.processEmail(message);
      }

      this.config.lastCheckedAt = new Date();
    } catch (error) {
      console.error('[Gmail Monitor] Error checking inbox:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual email
   */
  private async processEmail(message: any): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // Check if already processed
      const existing = await db.query.emailCommunications.findFirst({
        where: eq(emailCommunications.externalEmailId, message.id),
      });

      if (existing) {
        console.log(`[Gmail Monitor] Email ${message.id} already processed`);
        return;
      }

      // Extract case number from subject/body
      const matches = await this.findMatchingCases(message);

      if (matches.length === 0) {
        console.log(`[Gmail Monitor] No case match for email ${message.id}`);
        // Store as unlinked email
        await this.storeUnlinkedEmail(message);
        return;
      }

      // Use best match
      const bestMatch = matches[0];
      console.log(
        `[Gmail Monitor] Matched email ${message.id} to case ${bestMatch.caseNumber} (confidence: ${bestMatch.confidence})`
      );

      // Analyze response type
      const responseAnalysis = await this.analyzeCarrierResponse(message);

      // Store email
      await this.storeLinkedEmail(message, bestMatch.caseId, responseAnalysis);

      // Update case status
      await this.updateCaseStatus(bestMatch.caseId, responseAnalysis);

      // TODO: Send notification to user

    } catch (error) {
      console.error('[Gmail Monitor] Error processing email:', error);
    }
  }

  /**
   * Find matching cases for an email
   */
  private async findMatchingCases(message: any): Promise<EmailMatch[]> {
    const db = await getDb();
    if (!db) return [];

    const matches: EmailMatch[] = [];
    const subject = message.subject || '';
    const snippet = message.snippet || '';
    const text = `${subject} ${snippet}`.toLowerCase();

    // Pattern 1: Case number in format CASE-XXXXXX or similar
    const caseNumberPatterns = [
      /case[:\s#-]*([a-z0-9]{6,})/i,
      /claim[:\s#-]*([a-z0-9]{6,})/i,
      /ref[:\s#-]*([a-z0-9]{6,})/i,
      /\b([A-Z]{2,4}-\d{6,})\b/,
    ];

    for (const pattern of caseNumberPatterns) {
      const match = text.match(pattern);
      if (match) {
        const potentialCaseNumber = match[1].toUpperCase();
        
        // Look up case
        const caseRecord = await db.query.cases.findFirst({
          where: like(cases.caseNumber, `%${potentialCaseNumber}%`),
        });

        if (caseRecord) {
          matches.push({
            emailId: message.id,
            caseId: caseRecord.id,
            caseNumber: caseRecord.caseNumber,
            confidence: 0.95,
            matchReason: `Case number found in ${match.input?.includes(subject) ? 'subject' : 'body'}`,
          });
        }
      }
    }

    // Pattern 2: Tracking number
    const trackingPatterns = [
      /\b\d{12,}\b/, // USPS, FedEx
      /\b1Z[A-Z0-9]{16}\b/, // UPS
      /\b\d{10,11}\b/, // FedEx
    ];

    for (const pattern of trackingPatterns) {
      const match = text.match(pattern);
      if (match) {
        const trackingNumber = match[0];
        
        const caseRecord = await db.query.cases.findFirst({
          where: eq(cases.trackingId, trackingNumber),
        });

        if (caseRecord) {
          matches.push({
            emailId: message.id,
            caseId: caseRecord.id,
            caseNumber: caseRecord.caseNumber,
            confidence: 0.90,
            matchReason: 'Tracking number match',
          });
        }
      }
    }

    // Pattern 3: AI semantic matching (if no exact match)
    if (matches.length === 0) {
      const aiMatch = await this.aiSemanticMatch(message);
      if (aiMatch) {
        matches.push(aiMatch);
      }
    }

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * AI-powered semantic matching
   */
  private async aiSemanticMatch(message: any): Promise<EmailMatch | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      // Get recent open cases
      const recentCases = await db
        .select()
        .from(cases)
        .where(
          or(
            eq(cases.status, 'FILED'),
            eq(cases.status, 'AWAITING_RESPONSE')
          )
        )
        .orderBy(desc(cases.createdAt))
        .limit(20);

      if (recentCases.length === 0) return null;

      // Use AI to match
      const prompt = `Given this carrier email, identify which case it's responding to.

Email Subject: ${message.subject}
Email Snippet: ${message.snippet}

Open Cases:
${recentCases.map((c, i) => `${i + 1}. Case ${c.caseNumber} - Tracking: ${c.trackingId} - Carrier: ${c.carrier} - Amount: $${(c.claimedAmount / 100).toFixed(2)}`).join('\n')}

Return JSON with: { "caseNumber": "...", "confidence": 0.0-1.0, "reason": "..." }
If no match, return { "caseNumber": null, "confidence": 0 }`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an expert at matching emails to cases. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'case_match',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                caseNumber: { type: ['string', 'null'] },
                confidence: { type: 'number' },
                reason: { type: 'string' },
              },
              required: ['caseNumber', 'confidence', 'reason'],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(response.choices[0].message.content);

      if (result.caseNumber && result.confidence > 0.7) {
        const matchedCase = recentCases.find(c => c.caseNumber === result.caseNumber);
        if (matchedCase) {
          return {
            emailId: message.id,
            caseId: matchedCase.id,
            caseNumber: matchedCase.caseNumber,
            confidence: result.confidence,
            matchReason: `AI match: ${result.reason}`,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[Gmail Monitor] AI matching error:', error);
      return null;
    }
  }

  /**
   * Analyze carrier response type and extract data
   */
  private async analyzeCarrierResponse(message: any): Promise<CarrierResponse> {
    try {
      const text = `${message.subject} ${message.snippet}`.toLowerCase();

      // Simple keyword-based detection
      if (text.includes('approved') || text.includes('accepted') || text.includes('granted')) {
        return {
          type: 'approved',
          confidence: 0.85,
          extractedData: {},
        };
      }

      if (text.includes('denied') || text.includes('rejected') || text.includes('declined')) {
        return {
          type: 'denied',
          confidence: 0.85,
          extractedData: {},
        };
      }

      if (text.includes('additional information') || text.includes('more details') || text.includes('documentation needed')) {
        return {
          type: 'more_info_needed',
          confidence: 0.80,
          extractedData: {},
        };
      }

      if (text.includes('received') || text.includes('reviewing') || text.includes('processing')) {
        return {
          type: 'acknowledged',
          confidence: 0.75,
          extractedData: {},
        };
      }

      // Use AI for complex analysis
      return await this.aiAnalyzeResponse(message);

    } catch (error) {
      console.error('[Gmail Monitor] Response analysis error:', error);
      return {
        type: 'unknown',
        confidence: 0,
        extractedData: {},
      };
    }
  }

  /**
   * AI-powered response analysis
   */
  private async aiAnalyzeResponse(message: any): Promise<CarrierResponse> {
    try {
      const prompt = `Analyze this carrier email response and extract key information.

Subject: ${message.subject}
Body: ${message.snippet}

Determine:
1. Response type: approved, denied, partial, more_info_needed, acknowledged, or unknown
2. If approved: extract approved amount
3. If denied: extract denial reason
4. If more info needed: extract what's requested

Return JSON with the analysis.`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an expert at analyzing carrier dispute responses. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'response_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['approved', 'denied', 'partial', 'more_info_needed', 'acknowledged', 'unknown'],
                },
                confidence: { type: 'number' },
                approvedAmount: { type: ['number', 'null'] },
                denialReason: { type: ['string', 'null'] },
                requestedInfo: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['type', 'confidence'],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        type: result.type,
        confidence: result.confidence,
        extractedData: {
          approvedAmount: result.approvedAmount,
          denialReason: result.denialReason,
          requestedInfo: result.requestedInfo || [],
        },
      };

    } catch (error) {
      console.error('[Gmail Monitor] AI analysis error:', error);
      return {
        type: 'unknown',
        confidence: 0,
        extractedData: {},
      };
    }
  }

  /**
   * Store linked email in database
   */
  private async storeLinkedEmail(
    message: any,
    caseId: number,
    analysis: CarrierResponse
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(emailCommunications).values({
      caseId,
      direction: 'inbound',
      subject: message.subject,
      body: message.snippet,
      fromEmail: message.from,
      toEmail: message.to,
      externalEmailId: message.id,
      threadId: message.threadId,
      responseType: analysis.type,
      confidence: Math.round(analysis.confidence * 100),
      extractedData: JSON.stringify(analysis.extractedData),
      receivedAt: new Date(message.date),
    });

    console.log(`[Gmail Monitor] Stored email for case ${caseId}`);
  }

  /**
   * Store unlinked email for manual review
   */
  private async storeUnlinkedEmail(message: any): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(emailCommunications).values({
      caseId: null,
      direction: 'inbound',
      subject: message.subject,
      body: message.snippet,
      fromEmail: message.from,
      toEmail: message.to,
      externalEmailId: message.id,
      threadId: message.threadId,
      responseType: 'unknown',
      confidence: 0,
      receivedAt: new Date(message.date),
    });

    console.log(`[Gmail Monitor] Stored unlinked email ${message.id}`);
  }

  /**
   * Update case status based on response
   */
  private async updateCaseStatus(
    caseId: number,
    analysis: CarrierResponse
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const statusMap: Record<string, any> = {
      approved: 'RESOLVED',
      denied: 'REJECTED',
      partial: 'RESOLVED',
      more_info_needed: 'AWAITING_RESPONSE',
      acknowledged: 'FILED',
    };

    const newStatus = statusMap[analysis.type];
    if (!newStatus) return;

    // Update case
    await db
      .update(cases)
      .set({
        status: newStatus,
        recoveredAmount: analysis.extractedData.approvedAmount
          ? Math.round(analysis.extractedData.approvedAmount * 100)
          : undefined,
      })
      .where(eq(cases.id, caseId));

    console.log(`[Gmail Monitor] Updated case ${caseId} status to ${newStatus}`);
  }
}

// Singleton instance
export const gmailMonitor = new GmailMonitoringService();
