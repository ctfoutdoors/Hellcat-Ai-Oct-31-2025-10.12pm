import { getDb } from "../db";
import { cases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { simpleParser } from "mailparser";
import OpenAI from "openai";
// Email service imports removed - using console logging for now

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface EmailAnalysis {
  caseNumber?: string;
  trackingNumber?: string;
  status: "APPROVED" | "REJECTED" | "PENDING" | "REQUIRES_INFO" | "UNKNOWN";
  confidence: number;
  reasoning: string;
  extractedAmount?: number;
  responseDate?: string;
}

export class AutoStatusUpdatesService {
  /**
   * Analyze carrier response email and determine case status
   */
  static async analyzeCarrierResponse(rawEmail: string): Promise<EmailAnalysis> {
    const parsedEmail = await simpleParser(rawEmail);
    const emailText = parsedEmail.text || parsedEmail.html || "";
    const subject = parsedEmail.subject || "";
    const from = parsedEmail.from?.text || "";

    const analysisPrompt = `
You are an expert at analyzing carrier dispute response emails. Analyze this email and determine the case status.

**Email From:** ${from}
**Subject:** ${subject}
**Body:**
${emailText}

Determine:
1. Case number or tracking number (if mentioned)
2. Status: APPROVED (claim accepted), REJECTED (claim denied), PENDING (under review), REQUIRES_INFO (needs more information), or UNKNOWN
3. Confidence level (0-100)
4. Reasoning for the status determination
5. Approved/refund amount (if mentioned)
6. Response date

Return JSON:
{
  "caseNumber": "string or null",
  "trackingNumber": "string or null",
  "status": "APPROVED" | "REJECTED" | "PENDING" | "REQUIRES_INFO" | "UNKNOWN",
  "confidence": number (0-100),
  "reasoning": "string explaining the determination",
  "extractedAmount": number or null,
  "responseDate": "YYYY-MM-DD or null"
}

Return ONLY valid JSON, no other text.
`;

    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a precise email analysis assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.1,
    });

    const analysisText = completion.choices[0]?.message?.content || "{}";
    const analysis: EmailAnalysis = JSON.parse(analysisText);

    return analysis;
  }

  /**
   * Process carrier response email and update case status
   */
  static async processCarrierResponse(
    rawEmail: string,
    userId: number
  ): Promise<{
    caseId: number | null;
    updated: boolean;
    analysis: EmailAnalysis;
  }> {
    const analysis = await this.analyzeCarrierResponse(rawEmail);

    // Find matching case
    const db = getDb();
    let matchedCase = null;

    if (analysis.caseNumber) {
      matchedCase = await db.query.cases.findFirst({
        where: eq(cases.caseNumber, analysis.caseNumber),
      });
    } else if (analysis.trackingNumber) {
      matchedCase = await db.query.cases.findFirst({
        where: eq(cases.trackingNumber, analysis.trackingNumber),
      });
    }

    if (!matchedCase) {
      return {
        caseId: null,
        updated: false,
        analysis,
      };
    }

    // Update case status if confidence is high enough
    if (analysis.confidence >= 70 && analysis.status !== "UNKNOWN") {
      const statusMap: Record<string, string> = {
        APPROVED: "RESOLVED",
        REJECTED: "REJECTED",
        PENDING: "AWAITING_RESPONSE",
        REQUIRES_INFO: "REVIEW",
      };

      const newStatus = statusMap[analysis.status] || matchedCase.status;

      await db
        .update(cases)
        .set({
          status: newStatus as any,
          recoveredAmount: analysis.extractedAmount
            ? analysis.extractedAmount.toString()
            : matchedCase.recoveredAmount,
          updatedAt: new Date(),
        })
        .where(eq(cases.id, matchedCase.id));

      // Send notification to user
      // TODO: Implement status update notification
      console.log(`Status updated for case ${matchedCase.caseNumber}: ${matchedCase.status} -> ${newStatus}`);

      return {
        caseId: matchedCase.id,
        updated: true,
        analysis,
      };
    }

    return {
      caseId: matchedCase.id,
      updated: false,
      analysis,
    };
  }

  /**
   * Batch process multiple carrier response emails
   */
  static async batchProcessResponses(
    rawEmails: string[],
    userId: number
  ): Promise<{
    processed: number;
    updated: number;
    failed: number;
    results: Array<{
      caseId: number | null;
      updated: boolean;
      analysis: EmailAnalysis;
    }>;
  }> {
    const results = [];
    let processed = 0;
    let updated = 0;
    let failed = 0;

    for (const rawEmail of rawEmails) {
      try {
        const result = await this.processCarrierResponse(rawEmail, userId);
        results.push(result);
        processed++;
        if (result.updated) updated++;
      } catch (error) {
        failed++;
        console.error("Failed to process email:", error);
      }
    }

    return { processed, updated, failed, results };
  }

  /**
   * Monitor email inbox for carrier responses (webhook endpoint)
   */
  static async monitorInbox(
    emailProvider: "gmail" | "outlook" | "imap",
    credentials: any
  ): Promise<void> {
    // This would integrate with email providers via their APIs
    // For now, this is a placeholder for the webhook/polling logic
    console.log(`Monitoring ${emailProvider} inbox...`);
    // Implementation would depend on email provider
  }

  /**
   * Create status update rule
   */
  static async createStatusRule(rule: {
    triggerKeywords: string[];
    targetStatus: string;
    requiresApproval: boolean;
    notifyUser: boolean;
  }): Promise<void> {
    // Store rule in database for automated status updates
    // This allows custom rules like "if email contains 'approved', set status to RESOLVED"
    console.log("Status rule created:", rule);
  }
}
