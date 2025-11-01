import { getDb } from "../db";
import { cases } from "../../drizzle/schema";
import { Buffer } from "buffer";

/**
 * Note: pdf-parse has been removed due to deployment compatibility issues.
 * PDF text extraction is currently disabled. Use manual text input or AI image analysis instead.
 */

interface InvoiceData {
  trackingNumbers: string[];
  charges: Array<{
    trackingNumber: string;
    description: string;
    amount: number;
    isDimensionalWeight: boolean;
  }>;
  carrier?: string;
  invoiceDate?: string;
  totalAmount?: number;
}

export class PDFInvoiceScanner {
  /**
   * Extract text from PDF buffer
   */
  static async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    throw new Error("PDF text extraction is currently disabled. Please use manual text input or upload images for AI analysis instead.");
  }

  /**
   * Parse invoice text to extract tracking numbers and charges
   */
  static parseInvoiceText(text: string): InvoiceData {
    const trackingNumbers: string[] = [];
    const charges: Array<{
      trackingNumber: string;
      description: string;
      amount: number;
      isDimensionalWeight: boolean;
    }> = [];

    // Extract tracking numbers (various formats)
    // FedEx: 12 digits or 15 digits
    const fedexPattern = /\b(\d{12}|\d{15})\b/g;
    // UPS: 1Z followed by 16 alphanumeric
    const upsPattern = /\b1Z[A-Z0-9]{16}\b/g;
    // USPS: 20-22 digits
    const uspsPattern = /\b(\d{20,22})\b/g;

    const fedexMatches = text.match(fedexPattern) || [];
    const upsMatches = text.match(upsPattern) || [];
    const uspsMatches = text.match(uspsPattern) || [];

    trackingNumbers.push(...fedexMatches, ...upsMatches, ...uspsMatches);

    // Remove duplicates
    const uniqueTrackingNumbers = [...new Set(trackingNumbers)];

    // Extract charges (look for dimensional weight keywords)
    const lines = text.split("\n");
    const dimWeightKeywords = [
      "dimensional",
      "dim weight",
      "dimwt",
      "volumetric",
      "oversize",
      "additional handling",
      "adjustment",
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if line contains dimensional weight keywords
      const isDimWeight = dimWeightKeywords.some((keyword) =>
        line.includes(keyword)
      );

      // Extract amount from line (look for dollar amounts)
      const amountMatch = line.match(/\$?\s*(\d+\.\d{2})/);
      if (amountMatch && isDimWeight) {
        const amount = parseFloat(amountMatch[1]);
        
        // Try to find associated tracking number in nearby lines
        let trackingNumber = "";
        for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
          const nearbyLine = lines[j];
          for (const tn of uniqueTrackingNumbers) {
            if (nearbyLine.includes(tn)) {
              trackingNumber = tn;
              break;
            }
          }
          if (trackingNumber) break;
        }

        charges.push({
          trackingNumber: trackingNumber || uniqueTrackingNumbers[0] || "Unknown",
          description: lines[i].trim(),
          amount,
          isDimensionalWeight: isDimWeight,
        });
      }
    }

    // Detect carrier
    let carrier = "UNKNOWN";
    const textLower = text.toLowerCase();
    if (textLower.includes("fedex")) carrier = "FEDEX";
    else if (textLower.includes("ups")) carrier = "UPS";
    else if (textLower.includes("usps") || textLower.includes("postal")) carrier = "USPS";

    // Extract invoice date
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const dateMatch = text.match(datePattern);
    const invoiceDate = dateMatch ? dateMatch[1] : undefined;

    // Calculate total
    const totalAmount = charges.reduce((sum, charge) => sum + charge.amount, 0);

    return {
      trackingNumbers: uniqueTrackingNumbers,
      charges,
      carrier,
      invoiceDate,
      totalAmount,
    };
  }

  /**
   * Process PDF invoice and extract data
   */
  static async processInvoice(pdfBuffer: Buffer): Promise<InvoiceData> {
    const text = await this.extractTextFromPDF(pdfBuffer);
    const invoiceData = this.parseInvoiceText(text);
    return invoiceData;
  }

  /**
   * Auto-create draft cases from invoice charges
   */
  static async autoCreateCasesFromInvoice(
    invoiceData: InvoiceData,
    userId: number
  ): Promise<number[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const createdCaseIds: number[] = [];

    // Only create cases for dimensional weight charges
    const dimWeightCharges = invoiceData.charges.filter((c) => c.isDimensionalWeight);

    for (const charge of dimWeightCharges) {
      try {
        const [newCase] = await db
          .insert(cases)
          .values({
            trackingNumber: charge.trackingNumber,
            carrier: invoiceData.carrier || "UNKNOWN",
            claimedAmount: charge.amount,
            status: "DRAFT",
            priority: charge.amount > 20 ? "HIGH" : charge.amount > 10 ? "MEDIUM" : "LOW",
            disputeReason: charge.description,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        createdCaseIds.push(newCase.id);
      } catch (error: any) {
        console.error(`Error creating case for ${charge.trackingNumber}:`, error.message);
      }
    }

    return createdCaseIds;
  }

  /**
   * Batch process multiple PDF invoices
   */
  static async batchProcessInvoices(
    pdfBuffers: Buffer[],
    userId: number
  ): Promise<{
    success: boolean;
    processed: number;
    casesCreated: number;
    errors: string[];
  }> {
    let processed = 0;
    let casesCreated = 0;
    const errors: string[] = [];

    for (const pdfBuffer of pdfBuffers) {
      try {
        const invoiceData = await this.processInvoice(pdfBuffer);
        const caseIds = await this.autoCreateCasesFromInvoice(invoiceData, userId);
        
        processed++;
        casesCreated += caseIds.length;
      } catch (error: any) {
        errors.push(error.message);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      casesCreated,
      errors,
    };
  }
}
