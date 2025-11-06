import { invokeLLM } from '../_core/llm';
import { getDb } from '../db';
import { cases, emailCommunications } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

interface ParsedResponse {
  responseType: 'APPROVED' | 'DENIED' | 'PENDING' | 'REQUIRES_INFO' | 'PAYMENT_ISSUED' | 'UNKNOWN';
  confidence: number;
  suggestedStatus: string;
  confirmationNumber?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  denialReason?: string;
  requiredInfo?: string[];
  keyPhrases: string[];
  summary: string;
}

export class CarrierResponseParserService {
  /**
   * Parse carrier response email using AI
   */
  async parseCarrierResponse(emailContent: string, carrier: string): Promise<ParsedResponse> {
    const prompt = `You are an expert at analyzing carrier dispute response emails.

Analyze the following email from ${carrier} and extract key information:

EMAIL CONTENT:
${emailContent}

Extract the following information:
1. Response Type: Is this an APPROVAL, DENIAL, PENDING status, REQUEST FOR MORE INFO, or PAYMENT NOTIFICATION?
2. Confirmation Number: Any reference/confirmation/case numbers mentioned
3. Payment Amount: If payment is mentioned, extract the amount
4. Payment Method: How payment will be issued (check, credit, etc.)
5. Denial Reason: If denied, why?
6. Required Information: If more info is needed, what specifically?
7. Key Phrases: Important phrases that indicate the decision
8. Summary: Brief 1-2 sentence summary of the response

Respond in JSON format with this structure:
{
  "responseType": "APPROVED" | "DENIED" | "PENDING" | "REQUIRES_INFO" | "PAYMENT_ISSUED" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "confirmationNumber": "string or null",
  "paymentAmount": number or null,
  "paymentMethod": "string or null",
  "denialReason": "string or null",
  "requiredInfo": ["string"] or null,
  "keyPhrases": ["string"],
  "summary": "string"
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a carrier response email analyzer. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'carrier_response',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                responseType: {
                  type: 'string',
                  enum: ['APPROVED', 'DENIED', 'PENDING', 'REQUIRES_INFO', 'PAYMENT_ISSUED', 'UNKNOWN'],
                },
                confidence: { type: 'number' },
                confirmationNumber: { type: ['string', 'null'] },
                paymentAmount: { type: ['number', 'null'] },
                paymentMethod: { type: ['string', 'null'] },
                denialReason: { type: ['string', 'null'] },
                requiredInfo: {
                  type: ['array', 'null'],
                  items: { type: 'string' },
                },
                keyPhrases: {
                  type: 'array',
                  items: { type: 'string' },
                },
                summary: { type: 'string' },
              },
              required: ['responseType', 'confidence', 'keyPhrases', 'summary'],
              additionalProperties: false,
            },
          },
        },
      });

      const parsed = JSON.parse(response.choices[0].message.content);

      // Map response type to suggested status
      const suggestedStatus = this.mapResponseTypeToStatus(parsed.responseType);

      return {
        ...parsed,
        suggestedStatus,
      };

    } catch (error) {
      console.error('Failed to parse carrier response:', error);
      
      // Fallback to keyword-based parsing
      return this.fallbackParse(emailContent);
    }
  }

  /**
   * Fallback keyword-based parsing (when AI fails)
   */
  private fallbackParse(emailContent: string): ParsedResponse {
    const lowerContent = emailContent.toLowerCase();

    // Detect response type based on keywords
    let responseType: ParsedResponse['responseType'] = 'UNKNOWN';
    let confidence = 0.5;
    const keyPhrases: string[] = [];

    if (this.containsKeywords(lowerContent, ['approved', 'accepted', 'granted', 'in your favor'])) {
      responseType = 'APPROVED';
      confidence = 0.8;
      keyPhrases.push('approved');
    } else if (this.containsKeywords(lowerContent, ['denied', 'rejected', 'declined', 'not approved'])) {
      responseType = 'DENIED';
      confidence = 0.8;
      keyPhrases.push('denied');
    } else if (this.containsKeywords(lowerContent, ['payment', 'check', 'credit', 'refund', 'issued'])) {
      responseType = 'PAYMENT_ISSUED';
      confidence = 0.7;
      keyPhrases.push('payment issued');
    } else if (this.containsKeywords(lowerContent, ['pending', 'under review', 'investigating'])) {
      responseType = 'PENDING';
      confidence = 0.7;
      keyPhrases.push('pending review');
    } else if (this.containsKeywords(lowerContent, ['need', 'require', 'additional information', 'please provide'])) {
      responseType = 'REQUIRES_INFO';
      confidence = 0.7;
      keyPhrases.push('requires information');
    }

    // Extract confirmation number
    const confirmationMatch = emailContent.match(/(?:confirmation|reference|case|claim)\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9-]+)/i);
    const confirmationNumber = confirmationMatch ? confirmationMatch[1] : undefined;

    // Extract payment amount
    const amountMatch = emailContent.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const paymentAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : undefined;

    const suggestedStatus = this.mapResponseTypeToStatus(responseType);

    return {
      responseType,
      confidence,
      suggestedStatus,
      confirmationNumber,
      paymentAmount,
      keyPhrases,
      summary: `Detected ${responseType} response with ${Math.round(confidence * 100)}% confidence`,
    };
  }

  /**
   * Check if content contains any of the keywords
   */
  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword));
  }

  /**
   * Map response type to case status
   */
  private mapResponseTypeToStatus(responseType: string): string {
    const statusMap: Record<string, string> = {
      APPROVED: 'RESOLVED',
      DENIED: 'DENIED',
      PENDING: 'AWAITING_RESPONSE',
      REQUIRES_INFO: 'AWAITING_RESPONSE',
      PAYMENT_ISSUED: 'RESOLVED',
      UNKNOWN: 'AWAITING_RESPONSE',
    };

    return statusMap[responseType] || 'AWAITING_RESPONSE';
  }

  /**
   * Process incoming carrier email and update case
   */
  async processCarrierEmail(emailId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get email
    const emailResult = await db
      .select()
      .from(emailCommunications)
      .where(eq(emailCommunications.id, emailId))
      .limit(1);

    if (emailResult.length === 0) {
      throw new Error(`Email ${emailId} not found`);
    }

    const email = emailResult[0];

    if (!email.caseId) {
      console.warn(`Email ${emailId} not associated with a case`);
      return;
    }

    // Parse email content
    const parsed = await this.parseCarrierResponse(
      email.body || email.subject,
      email.carrier || 'UNKNOWN'
    );

    // Update case if confidence is high enough
    if (parsed.confidence >= 0.7) {
      const updateData: any = {
        status: parsed.suggestedStatus,
      };

      if (parsed.confirmationNumber) {
        updateData.confirmationNumber = parsed.confirmationNumber;
      }

      if (parsed.paymentAmount) {
        updateData.recoveredAmount = parsed.paymentAmount;
      }

      if (parsed.denialReason) {
        updateData.denialReason = parsed.denialReason;
      }

      await db
        .update(cases)
        .set(updateData)
        .where(eq(cases.id, email.caseId));

      console.log(`Updated case ${email.caseId} based on carrier response (${parsed.responseType})`);
    } else {
      console.log(`Low confidence (${parsed.confidence}) - manual review needed for case ${email.caseId}`);
    }

    // Update email with parsed data
    await db
      .update(emailCommunications)
      .set({
        aiParsedData: JSON.stringify(parsed),
      })
      .where(eq(emailCommunications.id, emailId));
  }

  /**
   * Batch process multiple carrier emails
   */
  async batchProcessEmails(emailIds: number[]): Promise<void> {
    for (const emailId of emailIds) {
      try {
        await this.processCarrierEmail(emailId);
      } catch (error) {
        console.error(`Failed to process email ${emailId}:`, error);
      }
    }
  }

  /**
   * Extract attachments from carrier response
   */
  async extractAttachments(emailId: number): Promise<string[]> {
    // TODO: Implement attachment extraction
    // This would integrate with email service to download attachments
    return [];
  }

  /**
   * Detect payment notifications
   */
  async detectPaymentNotification(emailContent: string): Promise<{
    isPayment: boolean;
    amount?: number;
    method?: string;
    checkNumber?: string;
    expectedDate?: string;
  }> {
    const lowerContent = emailContent.toLowerCase();

    const isPayment = this.containsKeywords(lowerContent, [
      'payment',
      'check',
      'refund',
      'credit',
      'reimbursement',
      'issued',
    ]);

    if (!isPayment) {
      return { isPayment: false };
    }

    // Extract payment details
    const amountMatch = emailContent.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : undefined;

    const checkMatch = emailContent.match(/check\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9-]+)/i);
    const checkNumber = checkMatch ? checkMatch[1] : undefined;

    let method = 'unknown';
    if (lowerContent.includes('check')) method = 'check';
    else if (lowerContent.includes('credit')) method = 'credit';
    else if (lowerContent.includes('ach') || lowerContent.includes('direct deposit')) method = 'ach';

    return {
      isPayment: true,
      amount,
      method,
      checkNumber,
    };
  }
}

// Singleton instance
export const carrierResponseParser = new CarrierResponseParserService();
