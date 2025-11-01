/**
 * Email Monitoring Service
 * Monitors incoming emails and auto-updates case status based on carrier responses
 */

import * as db from '../db';

interface EmailKeywords {
  approved: string[];
  denied: string[];
  pending: string[];
  requiresInfo: string[];
}

const CARRIER_KEYWORDS: EmailKeywords = {
  approved: [
    'approved',
    'credit issued',
    'refund processed',
    'claim accepted',
    'adjustment approved',
    'in your favor',
    'granted',
  ],
  denied: [
    'denied',
    'rejected',
    'declined',
    'not approved',
    'cannot approve',
    'claim denied',
    'insufficient evidence',
  ],
  pending: [
    'under review',
    'reviewing',
    'investigating',
    'pending review',
    'being processed',
    'received your claim',
  ],
  requiresInfo: [
    'additional information',
    'more details',
    'please provide',
    'need more',
    'missing information',
    'incomplete',
  ],
};

export class EmailMonitoringService {
  /**
   * Analyze email content and determine case status
   */
  static analyzeEmailContent(emailBody: string, emailSubject: string): {
    status: string | null;
    confidence: number;
    keywords: string[];
  } {
    const content = `${emailSubject} ${emailBody}`.toLowerCase();
    const foundKeywords: string[] = [];
    let detectedStatus: string | null = null;
    let maxMatches = 0;

    // Check for each status category
    const statusChecks = [
      { status: 'APPROVED', keywords: CARRIER_KEYWORDS.approved },
      { status: 'REJECTED', keywords: CARRIER_KEYWORDS.denied },
      { status: 'AWAITING_RESPONSE', keywords: CARRIER_KEYWORDS.pending },
      { status: 'REQUIRES_INFO', keywords: CARRIER_KEYWORDS.requiresInfo },
    ];

    for (const check of statusChecks) {
      const matches = check.keywords.filter(keyword => content.includes(keyword));
      
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        detectedStatus = check.status;
        foundKeywords.push(...matches);
      }
    }

    // Calculate confidence based on number of matching keywords
    const confidence = Math.min(maxMatches * 0.3, 1.0);

    return {
      status: detectedStatus,
      confidence,
      keywords: foundKeywords,
    };
  }

  /**
   * Process incoming email and update case status
   */
  static async processIncomingEmail(
    caseId: number,
    emailSubject: string,
    emailBody: string,
    emailFrom: string
  ): Promise<{
    updated: boolean;
    oldStatus: string;
    newStatus: string;
    confidence: number;
  }> {
    // Get current case
    const caseRecord = await db.getCaseById(caseId);
    
    if (!caseRecord) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Analyze email content
    const analysis = this.analyzeEmailContent(emailBody, emailSubject);

    // Only update if confidence is high enough
    if (analysis.confidence < 0.5 || !analysis.status) {
      return {
        updated: false,
        oldStatus: caseRecord.status,
        newStatus: caseRecord.status,
        confidence: analysis.confidence,
      };
    }

    // Update case status
    await db.updateCase(caseId, {
      status: analysis.status,
      notes: `${caseRecord.notes || ''}\n\n[Auto-updated from email on ${new Date().toISOString()}]\nFrom: ${emailFrom}\nSubject: ${emailSubject}\nDetected keywords: ${analysis.keywords.join(', ')}\nConfidence: ${(analysis.confidence * 100).toFixed(0)}%`,
    });

    return {
      updated: true,
      oldStatus: caseRecord.status,
      newStatus: analysis.status,
      confidence: analysis.confidence,
    };
  }

  /**
   * Check for time-based status updates
   * e.g., cases awaiting response for 30+ days should be marked for follow-up
   */
  static async checkTimeBasedRules(): Promise<{
    updated: number;
    cases: Array<{ caseId: number; caseNumber: string; action: string }>;
  }> {
    const results: Array<{ caseId: number; caseNumber: string; action: string }> = [];
    
    // Get all active cases
    const cases = await db.getAllCases();
    const now = new Date();

    for (const caseRecord of cases) {
      const daysSinceCreated = Math.floor(
        (now.getTime() - new Date(caseRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Rule 1: Cases in AWAITING_RESPONSE for 30+ days → FOLLOW_UP_NEEDED
      if (
        caseRecord.status === 'AWAITING_RESPONSE' &&
        daysSinceCreated >= 30
      ) {
        await db.updateCase(caseRecord.id, {
          status: 'FILED',
          priority: 'HIGH',
          notes: `${caseRecord.notes || ''}\n\n[Auto-updated: ${now.toISOString()}]\nCase has been awaiting response for ${daysSinceCreated} days. Escalated to high priority for follow-up.`,
        });

        results.push({
          caseId: caseRecord.id,
          caseNumber: caseRecord.caseNumber,
          action: `Escalated after ${daysSinceCreated} days without response`,
        });
      }

      // Rule 2: Draft cases older than 7 days → Send reminder
      if (
        caseRecord.status === 'DRAFT' &&
        daysSinceCreated >= 7
      ) {
        await db.updateCase(caseRecord.id, {
          priority: 'MEDIUM',
          notes: `${caseRecord.notes || ''}\n\n[Auto-updated: ${now.toISOString()}]\nDraft case pending for ${daysSinceCreated} days. Consider filing or closing.`,
        });

        results.push({
          caseId: caseRecord.id,
          caseNumber: caseRecord.caseNumber,
          action: `Draft reminder after ${daysSinceCreated} days`,
        });
      }
    }

    return {
      updated: results.length,
      cases: results,
    };
  }

  /**
   * Get configurable rules
   */
  static getDefaultRules() {
    return {
      timeBasedRules: [
        {
          id: 'awaiting_response_30d',
          name: 'Follow-up after 30 days',
          condition: 'status === AWAITING_RESPONSE && days >= 30',
          action: 'Set priority to HIGH',
          enabled: true,
        },
        {
          id: 'draft_7d',
          name: 'Draft reminder after 7 days',
          condition: 'status === DRAFT && days >= 7',
          action: 'Set priority to MEDIUM',
          enabled: true,
        },
      ],
      keywordRules: CARRIER_KEYWORDS,
    };
  }
}
