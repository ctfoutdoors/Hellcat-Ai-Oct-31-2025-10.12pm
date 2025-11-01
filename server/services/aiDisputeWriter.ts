import { getDb } from "../db";
import { cases, certifications, knowledgeBase } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DisputeLetterOptions {
  tone?: "professional" | "firm" | "conciliatory";
  includeDeadline?: boolean;
  includeLegalLanguage?: boolean;
  requestExpedited?: boolean;
}

export class AIDisputeWriterService {
  /**
   * Generate AI-powered dispute letter
   */
  static async generateDisputeLetter(
    caseId: number,
    options: DisputeLetterOptions = {}
  ): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Fetch case data
    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
      with: {
        attachments: true,
      },
    });

    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Fetch certification if available
    let certification = null;
    if (caseData.productName) {
      certification = await db.query.certifications.findFirst({
        where: eq(certifications.productName, caseData.productName),
      });
    }

    // Fetch relevant knowledge base articles
    const knowledgeArticles = await db.query.knowledgeBase.findMany({
      where: eq(knowledgeBase.category, "dispute_strategies"),
      limit: 5,
    });

    // Build context for AI
    const context = this.buildContext(caseData, certification, knowledgeArticles, options);

    // Generate letter using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(options),
        },
        {
          role: "user",
          content: context,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const letter = completion.choices[0]?.message?.content || "";

    return letter;
  }

  /**
   * Get system prompt based on options
   */
  private static getSystemPrompt(options: DisputeLetterOptions): string {
    const tone = options.tone || "professional";
    
    let prompt = `You are an expert at writing carrier dispute letters for dimensional weight adjustments. `;
    
    if (tone === "professional") {
      prompt += `Write in a professional, business-like tone that is respectful but firm. `;
    } else if (tone === "firm") {
      prompt += `Write in a firm, assertive tone that emphasizes the strength of the evidence. `;
    } else if (tone === "conciliatory") {
      prompt += `Write in a conciliatory, cooperative tone that seeks mutual resolution. `;
    }

    prompt += `Your letter should:\n`;
    prompt += `1. Clearly state the dispute and the amount being contested\n`;
    prompt += `2. Present evidence in a logical, compelling manner\n`;
    prompt += `3. Reference specific documentation (appendices)\n`;
    prompt += `4. Cite manufacturer certifications when available\n`;
    prompt += `5. Point out physical impossibilities or measurement errors\n`;
    prompt += `6. Request specific action (refund/credit)\n`;
    
    if (options.includeDeadline) {
      prompt += `7. Include a reasonable deadline for response (typically 14 business days)\n`;
    }
    
    if (options.includeLegalLanguage) {
      prompt += `8. Include appropriate legal language about carrier liability and tariff compliance\n`;
    }
    
    if (options.requestExpedited) {
      prompt += `9. Request expedited processing due to the clear nature of the error\n`;
    }

    prompt += `\nFormat the letter as a professional business letter with proper structure.`;

    return prompt;
  }

  /**
   * Build context for AI
   */
  private static buildContext(
    caseData: any,
    certification: any,
    knowledgeArticles: any[],
    options: DisputeLetterOptions
  ): string {
    let context = `Generate a dispute letter for the following case:\n\n`;

    // Case details
    context += `CASE INFORMATION:\n`;
    context += `Case Number: ${caseData.caseNumber}\n`;
    context += `Tracking Number: ${caseData.trackingNumber}\n`;
    context += `Carrier: ${caseData.carrier}\n`;
    context += `Dispute Amount: $${parseFloat(caseData.disputeAmount || "0").toFixed(2)}\n\n`;

    // Shipment details
    context += `SHIPMENT DETAILS:\n`;
    context += `Ship Date: ${caseData.shipDate ? new Date(caseData.shipDate).toLocaleDateString() : "N/A"}\n`;
    context += `From: ${caseData.shipperName || "N/A"}, ${caseData.shipperCity || ""}, ${caseData.shipperState || ""}\n`;
    context += `To: ${caseData.recipientName || "N/A"}, ${caseData.recipientCity || ""}, ${caseData.recipientState || ""}\n`;
    context += `Product: ${caseData.productName || "N/A"}\n\n`;

    // Dimensional discrepancy
    context += `DIMENSIONAL DISCREPANCY:\n`;
    if (caseData.productDimensions) {
      const dims = caseData.productDimensions as any;
      context += `Actual Dimensions: ${dims.length}" × ${dims.width}" × ${dims.height}"\n`;
      context += `Actual Weight: ${dims.weight} lbs\n`;
    }
    if (caseData.billedDimensions) {
      const dims = caseData.billedDimensions as any;
      context += `Carrier Claimed Dimensions: ${dims.length}" × ${dims.width}" × ${dims.height}"\n`;
    }
    context += `Actual Dim Weight: ${caseData.actualDimWeight || "N/A"} lbs\n`;
    context += `Billed Dim Weight: ${caseData.billedDimWeight || "N/A"} lbs\n\n`;

    // Certification
    if (certification) {
      context += `MANUFACTURER CERTIFICATION AVAILABLE:\n`;
      context += `Product: ${certification.productName}\n`;
      context += `Manufacturer: ${certification.manufacturer}\n`;
      context += `Certified Dimensions: ${certification.lengthInches}" × ${certification.widthInches}" × ${certification.heightInches}"\n`;
      context += `Shape: ${certification.shape}\n`;
      context += `Certification Date: ${new Date(certification.certificationDate).toLocaleDateString()}\n`;
      if (certification.thirdPartyProvider) {
        context += `3PL Verification: ${certification.thirdPartyProvider}\n`;
      }
      context += `Reference this as APPENDIX A in the letter.\n\n`;
    }

    // Evidence list
    context += `EVIDENCE AVAILABLE:\n`;
    let appendixLetter = certification ? "B" : "A";
    context += `- APPENDIX ${appendixLetter}: Invoice showing dimensional weight adjustment\n`;
    appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    context += `- APPENDIX ${appendixLetter}: Delivery photo (carrier's own photo)\n`;
    appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    context += `- APPENDIX ${appendixLetter}: ShipStation shipping record with actual dimensions\n`;
    appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    context += `- APPENDIX ${appendixLetter}: 3PL provider verification\n\n`;

    // Dispute reason
    context += `DISPUTE REASON:\n`;
    context += `${caseData.disputeReason || "The dimensional weight adjustment is incorrect based on actual product dimensions."}\n\n`;

    // Key arguments from knowledge base
    if (knowledgeArticles.length > 0) {
      context += `EFFECTIVE DISPUTE STRATEGIES (from knowledge base):\n`;
      knowledgeArticles.forEach((article) => {
        context += `- ${article.title}: ${article.content.substring(0, 200)}...\n`;
      });
      context += `\n`;
    }

    // Additional notes
    if (caseData.notes) {
      context += `ADDITIONAL NOTES:\n`;
      context += `${caseData.notes}\n\n`;
    }

    // Specific instructions
    context += `LETTER REQUIREMENTS:\n`;
    context += `- Address to: ${caseData.carrier} Claims Department\n`;
    context += `- From: ${caseData.shipperName || "Catch The Fever"}\n`;
    context += `- Request: Full refund of $${parseFloat(caseData.disputeAmount || "0").toFixed(2)}\n`;
    if (options.includeDeadline) {
      context += `- Include deadline: 14 business days from receipt\n`;
    }
    if (options.requestExpedited) {
      context += `- Request expedited processing\n`;
    }
    context += `\nGenerate a complete, professional dispute letter now.`;

    return context;
  }

  /**
   * Generate dispute letter with specific carrier template
   */
  static async generateCarrierSpecificLetter(
    caseId: number,
    carrier: string,
    options: DisputeLetterOptions = {}
  ): Promise<string> {
    // Add carrier-specific instructions
    const carrierTemplates: Record<string, string> = {
      FEDEX: "Use FedEx-specific terminology. Reference FedEx Service Guide and dimensional weight policies. Address to FedEx Claims Department.",
      UPS: "Use UPS-specific terminology. Reference UPS Tariff/Terms and Conditions. Address to UPS Claims Department.",
      USPS: "Use USPS-specific terminology. Reference Domestic Mail Manual (DMM). Address to USPS Claims Department.",
      DHL: "Use DHL-specific terminology. Reference DHL Terms and Conditions. Address to DHL Claims Department.",
    };

    // This would be passed to the AI prompt
    const carrierInstructions = carrierTemplates[carrier] || "Use standard carrier terminology.";

    return this.generateDisputeLetter(caseId, options);
  }
}
