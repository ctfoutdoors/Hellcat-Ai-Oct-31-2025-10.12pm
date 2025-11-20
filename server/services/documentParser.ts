import { invokeLLM } from "../_core/llm";

/**
 * AI Document Parser for Carrier Dispute Claims
 * Extracts structured claim information from uploaded documents
 */

export interface ParsedClaimData {
  title: string;
  description: string;
  caseType: "late_delivery" | "damaged_goods" | "lost_package" | "incorrect_charges" | "service_failure" | "other";
  carrier: string;
  trackingNumber: string;
  claimAmount: number;
  priority: "low" | "medium" | "high" | "urgent";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderNumber?: string;
  shipmentDate?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  confidence: number; // 0-100
  extractedText?: string;
}

/**
 * Parse document content using AI to extract claim details
 * @param documentText - Raw text extracted from document (OCR or PDF text)
 * @param fileName - Original file name for context
 * @returns Structured claim data
 */
export async function parseClaimDocument(
  documentText: string,
  fileName: string
): Promise<ParsedClaimData> {
  const systemPrompt = `You are an AI assistant specialized in extracting carrier dispute claim information from documents.
Your task is to analyze the provided document text and extract structured claim data.

Extract the following information:
- Title: A brief, descriptive title for the claim
- Description: Detailed description of the issue
- Case Type: One of: late_delivery, damaged_goods, lost_package, incorrect_charges, service_failure, other
- Carrier: Shipping carrier name (UPS, FedEx, USPS, DHL, etc.)
- Tracking Number: Shipment tracking number
- Claim Amount: Dollar amount being claimed (numeric value only)
- Priority: Urgency level (low, medium, high, urgent)
- Customer Name: Recipient or sender name
- Customer Email: Contact email
- Customer Phone: Contact phone number
- Order Number: Order or invoice number
- Shipment Date: Date package was shipped
- Delivery Date: Actual delivery date (if delivered)
- Expected Delivery Date: Originally promised delivery date

Return ONLY valid JSON with the extracted data. Use null for missing fields.
Provide a confidence score (0-100) indicating how confident you are in the extraction.`;

  const userPrompt = `Document File Name: ${fileName}

Document Content:
${documentText}

Extract the claim information and return as JSON with this structure:
{
  "title": "string",
  "description": "string",
  "caseType": "late_delivery|damaged_goods|lost_package|incorrect_charges|service_failure|other",
  "carrier": "string",
  "trackingNumber": "string",
  "claimAmount": number,
  "priority": "low|medium|high|urgent",
  "customerName": "string or null",
  "customerEmail": "string or null",
  "customerPhone": "string or null",
  "orderNumber": "string or null",
  "shipmentDate": "YYYY-MM-DD or null",
  "deliveryDate": "YYYY-MM-DD or null",
  "expectedDeliveryDate": "YYYY-MM-DD or null",
  "confidence": number (0-100)
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "claim_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              caseType: {
                type: "string",
                enum: ["late_delivery", "damaged_goods", "lost_package", "incorrect_charges", "service_failure", "other"],
              },
              carrier: { type: "string" },
              trackingNumber: { type: "string" },
              claimAmount: { type: "number" },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent"],
              },
              customerName: { type: ["string", "null"] },
              customerEmail: { type: ["string", "null"] },
              customerPhone: { type: ["string", "null"] },
              orderNumber: { type: ["string", "null"] },
              shipmentDate: { type: ["string", "null"] },
              deliveryDate: { type: ["string", "null"] },
              expectedDeliveryDate: { type: ["string", "null"] },
              confidence: { type: "number" },
            },
            required: [
              "title",
              "description",
              "caseType",
              "carrier",
              "trackingNumber",
              "claimAmount",
              "priority",
              "confidence",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as ParsedClaimData;
    parsed.extractedText = documentText.substring(0, 1000); // Store first 1000 chars for reference

    return parsed;
  } catch (error) {
    console.error("[Document Parser] Failed to parse document:", error);
    throw new Error("Failed to parse document with AI");
  }
}

/**
 * Extract text from base64-encoded document
 * Supports images (via OCR placeholder) and text-based PDFs
 */
export async function extractTextFromDocument(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  // For now, return a placeholder. In production, you would:
  // 1. For images: Use OCR service (Tesseract, Google Vision API, etc.)
  // 2. For PDFs: Use PDF parsing library (pdf-parse, pdfjs-dist)
  // 3. For documents: Use document parsing service

  if (mimeType.startsWith("image/")) {
    // TODO: Implement OCR using Tesseract or cloud OCR service
    return `[OCR extraction not yet implemented for ${fileName}. Please manually enter claim details.]`;
  }

  if (mimeType === "application/pdf") {
    // TODO: Implement PDF text extraction
    return `[PDF text extraction not yet implemented for ${fileName}. Please manually enter claim details.]`;
  }

  // For plain text files
  if (mimeType.startsWith("text/")) {
    try {
      const buffer = Buffer.from(base64Data, "base64");
      return buffer.toString("utf-8");
    } catch (error) {
      console.error("[Document Parser] Failed to decode text file:", error);
      return "";
    }
  }

  return `[Unsupported file type: ${mimeType}]`;
}
