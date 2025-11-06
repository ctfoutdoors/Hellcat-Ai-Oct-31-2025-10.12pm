import { simpleParser, ParsedMail } from "mailparser";
import { getDb } from "../db";
import { cases, attachments } from "../../drizzle/schema";
import OpenAI from "openai";
import { storagePut } from "../storage";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface ExtractedCaseData {
  trackingNumber: string;
  carrier: "FEDEX" | "UPS" | "USPS" | "DHL";
  claimedAmount: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: "in" | "cm";
  };
  weight?: {
    value: number;
    unit: "lb" | "kg";
  };
  adjustmentReason?: string;
  adjustmentDate?: string;
  confidence: number;
}

export class EmailToCaseImporter {
  /**
   * Parse raw email and extract case data using AI
   */
  static async processEmail(rawEmail: string): Promise<{
    caseData: ExtractedCaseData;
    parsedEmail: ParsedMail;
  }> {
    // Parse email
    const parsedEmail = await simpleParser(rawEmail);

    // Extract text content
    const emailText = parsedEmail.text || parsedEmail.html || "";
    const subject = parsedEmail.subject || "";
    const from = parsedEmail.from?.text || "";

    // Use AI to extract case data
    const extractionPrompt = `
You are an expert at parsing carrier adjustment emails. Extract the following information from this email:

**Email From:** ${from}
**Subject:** ${subject}
**Body:**
${emailText}

Extract and return JSON with:
{
  "trackingNumber": "string (tracking number)",
  "carrier": "FEDEX" | "UPS" | "USPS" | "DHL",
  "claimedAmount": number (adjustment charge amount),
  "dimensions": {
    "length": number,
    "width": number,
    "height": number,
    "unit": "in" | "cm"
  },
  "weight": {
    "value": number,
    "unit": "lb" | "kg"
  },
  "adjustmentReason": "string (reason for adjustment)",
  "adjustmentDate": "YYYY-MM-DD",
  "confidence": number (0-100, your confidence in extraction accuracy)
}

If any field is not found, omit it from the JSON. Return ONLY valid JSON, no other text.
`;

    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
      temperature: 0.1,
    });

    const extractedText = completion.choices[0]?.message?.content || "{}";
    const caseData: ExtractedCaseData = JSON.parse(extractedText);

    return { caseData, parsedEmail };
  }

  /**
   * Create case from extracted email data
   */
  static async createCaseFromEmail(
    rawEmail: string,
    userId: number
  ): Promise<number> {
    const { caseData, parsedEmail } = await this.processEmail(rawEmail);

    const db = getDb();

    // Create case
    const [newCase] = await db
      .insert(cases)
      .values({
        trackingNumber: caseData.trackingNumber,
        carrier: caseData.carrier,
        claimedAmount: caseData.claimedAmount.toString(),
        status: "REVIEW", // Requires manual review
        priority: "MEDIUM",
        createdBy: userId,
        notes: `Auto-created from email. Confidence: ${caseData.confidence}%\n\nAdjustment Reason: ${caseData.adjustmentReason || "Not specified"}`,
      })
      .returning();

    const caseId = newCase.id;

    // Store original email as attachment
    const emailFileName = `email-${Date.now()}.eml`;
    const emailBuffer = Buffer.from(rawEmail, "utf-8");
    
    const { url: emailUrl } = await storagePut(
      `cases/${caseId}/${emailFileName}`,
      emailBuffer,
      "message/rfc822"
    );

    await db.insert(attachments).values({
      caseId,
      fileName: emailFileName,
      fileUrl: emailUrl,
      fileType: "message/rfc822",
      uploadedBy: userId,
    });

    // Store email attachments if any
    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
      for (const attachment of parsedEmail.attachments) {
        const attachmentFileName = attachment.filename || `attachment-${Date.now()}`;
        const { url: attachmentUrl } = await storagePut(
          `cases/${caseId}/${attachmentFileName}`,
          attachment.content,
          attachment.contentType
        );

        await db.insert(attachments).values({
          caseId,
          fileName: attachmentFileName,
          fileUrl: attachmentUrl,
          fileType: attachment.contentType,
          uploadedBy: userId,
        });
      }
    }

    return caseId;
  }

  /**
   * Batch process multiple emails
   */
  static async batchProcessEmails(
    rawEmails: string[],
    userId: number
  ): Promise<{
    successful: number[];
    failed: { index: number; error: string }[];
  }> {
    const successful: number[] = [];
    const failed: { index: number; error: string }[] = [];

    for (let i = 0; i < rawEmails.length; i++) {
      try {
        const caseId = await this.createCaseFromEmail(rawEmails[i], userId);
        successful.push(caseId);
      } catch (error: any) {
        failed.push({
          index: i,
          error: error.message || "Unknown error",
        });
      }
    }

    return { successful, failed };
  }
}
