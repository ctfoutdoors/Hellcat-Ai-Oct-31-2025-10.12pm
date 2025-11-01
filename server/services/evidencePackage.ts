import { getDb } from "../db";
import { cases, attachments, certifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import archiver from "archiver";
import { Readable } from "stream";
import path from "path";

export interface EvidenceFile {
  filename: string;
  content: Buffer | string;
  type: string;
}

export class EvidencePackageService {
  /**
   * Build complete evidence package for a case
   */
  static async buildEvidencePackage(caseId: number): Promise<Buffer> {
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

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    const chunks: Buffer[] = [];
    archive.on("data", (chunk) => chunks.push(chunk));

    // 1. Add cover letter
    const coverLetter = this.generateCoverLetter(caseData, certification);
    archive.append(coverLetter, { name: "00-COVER-LETTER.txt" });

    // 2. Add case summary
    const caseSummary = this.generateCaseSummary(caseData);
    archive.append(caseSummary, { name: "01-CASE-SUMMARY.txt" });

    // 3. Add manufacturer certification (if available)
    if (certification) {
      const certDoc = this.generateCertificationDocument(certification);
      archive.append(certDoc, { name: "APPENDIX-A-MANUFACTURER-CERTIFICATION.txt" });
    }

    // 4. Add attachments with proper naming
    let appendixIndex = certification ? "B" : "A";
    const attachmentsByType: Record<string, any[]> = {};

    caseData.attachments.forEach((att) => {
      const type = att.type || "other";
      if (!attachmentsByType[type]) {
        attachmentsByType[type] = [];
      }
      attachmentsByType[type].push(att);
    });

    // Invoice
    if (attachmentsByType["invoice"]) {
      attachmentsByType["invoice"].forEach((att, idx) => {
        const ext = path.extname(att.filename || "file.pdf");
        const filename = `APPENDIX-${appendixIndex}-INVOICE-${idx + 1}${ext}`;
        // Note: In production, fetch actual file from S3/storage
        archive.append(`[Invoice file: ${att.filename}]`, { name: filename });
      });
      appendixIndex = String.fromCharCode(appendixIndex.charCodeAt(0) + 1);
    }

    // Delivery Photo
    if (attachmentsByType["delivery_photo"]) {
      attachmentsByType["delivery_photo"].forEach((att, idx) => {
        const ext = path.extname(att.filename || "photo.jpg");
        const filename = `APPENDIX-${appendixIndex}-DELIVERY-PHOTO-${idx + 1}${ext}`;
        archive.append(`[Delivery photo: ${att.filename}]`, { name: filename });
      });
      appendixIndex = String.fromCharCode(appendixIndex.charCodeAt(0) + 1);
    }

    // ShipStation Records
    if (attachmentsByType["shipstation_record"]) {
      attachmentsByType["shipstation_record"].forEach((att, idx) => {
        const ext = path.extname(att.filename || "record.pdf");
        const filename = `APPENDIX-${appendixIndex}-SHIPSTATION-RECORD-${idx + 1}${ext}`;
        archive.append(`[ShipStation record: ${att.filename}]`, { name: filename });
      });
      appendixIndex = String.fromCharCode(appendixIndex.charCodeAt(0) + 1);
    }

    // 3PL Documentation
    if (attachmentsByType["3pl_docs"]) {
      attachmentsByType["3pl_docs"].forEach((att, idx) => {
        const ext = path.extname(att.filename || "doc.pdf");
        const filename = `APPENDIX-${appendixIndex}-3PL-DOCUMENTATION-${idx + 1}${ext}`;
        archive.append(`[3PL documentation: ${att.filename}]`, { name: filename });
      });
      appendixIndex = String.fromCharCode(appendixIndex.charCodeAt(0) + 1);
    }

    // Other attachments
    if (attachmentsByType["other"]) {
      attachmentsByType["other"].forEach((att, idx) => {
        const ext = path.extname(att.filename || "file.pdf");
        const filename = `APPENDIX-${appendixIndex}-SUPPORTING-DOC-${idx + 1}${ext}`;
        archive.append(`[Supporting document: ${att.filename}]`, { name: filename });
      });
    }

    // 5. Add evidence index
    const evidenceIndex = this.generateEvidenceIndex(caseData, certification, attachmentsByType);
    archive.append(evidenceIndex, { name: "EVIDENCE-INDEX.txt" });

    // Finalize archive
    await archive.finalize();

    return new Promise((resolve, reject) => {
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);
    });
  }

  /**
   * Generate cover letter
   */
  private static generateCoverLetter(caseData: any, certification: any): string {
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let letter = `CARRIER DIMENSIONAL WEIGHT DISPUTE\n`;
    letter += `Evidence Package\n\n`;
    letter += `Date: ${date}\n`;
    letter += `Case Number: ${caseData.caseNumber}\n`;
    letter += `Tracking Number: ${caseData.trackingNumber}\n`;
    letter += `Carrier: ${caseData.carrier}\n\n`;
    letter += `DISPUTE AMOUNT: $${parseFloat(caseData.disputeAmount || "0").toFixed(2)}\n\n`;
    letter += `Dear ${caseData.carrier} Claims Department,\n\n`;
    letter += `This evidence package contains all supporting documentation for the above-referenced `;
    letter += `dimensional weight dispute. The package includes:\n\n`;

    let appendixLetter = "A";
    if (certification) {
      letter += `APPENDIX ${appendixLetter}: Manufacturer Certification\n`;
      appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    }
    letter += `APPENDIX ${appendixLetter}: Invoice/Billing Statement\n`;
    appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    letter += `APPENDIX ${appendixLetter}: Delivery Photo\n`;
    appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    letter += `APPENDIX ${appendixLetter}: ShipStation Shipping Record\n`;
    appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    letter += `APPENDIX ${appendixLetter}: 3PL Verification Documentation\n\n`;

    letter += `The evidence clearly demonstrates that the dimensional weight adjustment applied `;
    letter += `to this shipment was incorrect. We request a full refund of the disputed amount.\n\n`;
    letter += `Please review the enclosed documentation and process this dispute accordingly.\n\n`;
    letter += `Sincerely,\n\n`;
    letter += `${caseData.shipperName || "Catch The Fever"}\n`;
    letter += `${caseData.shipperEmail || ""}\n`;

    return letter;
  }

  /**
   * Generate case summary
   */
  private static generateCaseSummary(caseData: any): string {
    let summary = `CASE SUMMARY\n`;
    summary += `============\n\n`;
    summary += `Case Number: ${caseData.caseNumber}\n`;
    summary += `Tracking Number: ${caseData.trackingNumber}\n`;
    summary += `Carrier: ${caseData.carrier}\n`;
    summary += `Status: ${caseData.status}\n`;
    summary += `Priority: ${caseData.priority}\n\n`;

    summary += `SHIPMENT DETAILS\n`;
    summary += `----------------\n`;
    summary += `Ship Date: ${caseData.shipDate ? new Date(caseData.shipDate).toLocaleDateString() : "N/A"}\n`;
    summary += `Delivery Date: ${caseData.deliveryDate ? new Date(caseData.deliveryDate).toLocaleDateString() : "N/A"}\n\n`;

    summary += `Shipper: ${caseData.shipperName || "N/A"}\n`;
    summary += `Shipper Address: ${caseData.shipperAddress || "N/A"}\n`;
    summary += `Shipper City, State ZIP: ${caseData.shipperCity || ""}, ${caseData.shipperState || ""} ${caseData.shipperZip || ""}\n\n`;

    summary += `Recipient: ${caseData.recipientName || "N/A"}\n`;
    summary += `Recipient Address: ${caseData.recipientAddress || "N/A"}\n`;
    summary += `Recipient City, State ZIP: ${caseData.recipientCity || ""}, ${caseData.recipientState || ""} ${caseData.recipientZip || ""}\n\n`;

    summary += `PRODUCT INFORMATION\n`;
    summary += `-------------------\n`;
    summary += `Product: ${caseData.productName || "N/A"}\n`;
    if (caseData.productDimensions) {
      const dims = caseData.productDimensions as any;
      summary += `Actual Dimensions: ${dims.length}" × ${dims.width}" × ${dims.height}"\n`;
      summary += `Actual Weight: ${dims.weight} lbs\n`;
    }
    if (caseData.billedDimensions) {
      const dims = caseData.billedDimensions as any;
      summary += `Billed Dimensions: ${dims.length}" × ${dims.width}" × ${dims.height}"\n`;
    }
    summary += `Actual Dim Weight: ${caseData.actualDimWeight || "N/A"} lbs\n`;
    summary += `Billed Dim Weight: ${caseData.billedDimWeight || "N/A"} lbs\n\n`;

    summary += `FINANCIAL DETAILS\n`;
    summary += `-----------------\n`;
    summary += `Original Charge: $${parseFloat(caseData.originalAmount || "0").toFixed(2)}\n`;
    summary += `Adjusted Charge: $${parseFloat(caseData.adjustedAmount || "0").toFixed(2)}\n`;
    summary += `Dispute Amount: $${parseFloat(caseData.disputeAmount || "0").toFixed(2)}\n\n`;

    summary += `DISPUTE REASON\n`;
    summary += `--------------\n`;
    summary += `${caseData.disputeReason || "Dimensional weight error"}\n\n`;

    if (caseData.notes) {
      summary += `ADDITIONAL NOTES\n`;
      summary += `----------------\n`;
      summary += `${caseData.notes}\n\n`;
    }

    summary += `Case Created: ${new Date(caseData.createdAt).toLocaleString()}\n`;
    summary += `Last Updated: ${new Date(caseData.updatedAt).toLocaleString()}\n`;

    return summary;
  }

  /**
   * Generate certification document
   */
  private static generateCertificationDocument(cert: any): string {
    let doc = `MANUFACTURER CERTIFICATION\n`;
    doc += `=========================\n\n`;
    doc += `Product: ${cert.productName}\n`;
    doc += `Manufacturer: ${cert.manufacturer}\n`;
    doc += `Manufacturing Location: ${cert.manufacturingLocation || "N/A"}\n\n`;

    doc += `CERTIFIED DIMENSIONS\n`;
    doc += `--------------------\n`;
    doc += `Length: ${cert.lengthInches}" (${cert.lengthCm} cm)\n`;
    doc += `Width: ${cert.widthInches}" (${cert.widthCm} cm)\n`;
    doc += `Height: ${cert.heightInches}" (${cert.heightCm} cm)\n`;
    doc += `Shape: ${cert.shape}\n\n`;

    doc += `CERTIFICATION DETAILS\n`;
    doc += `---------------------\n`;
    doc += `Certification Date: ${new Date(cert.certificationDate).toLocaleDateString()}\n`;
    doc += `Expiration Date: ${new Date(cert.expirationDate).toLocaleDateString()}\n`;
    doc += `Certification Number: ${cert.certificationNumber || "N/A"}\n\n`;

    if (cert.thirdPartyProvider) {
      doc += `3PL PROVIDER\n`;
      doc += `------------\n`;
      doc += `Provider: ${cert.thirdPartyProvider}\n`;
      doc += `Address: ${cert.thirdPartyAddress || "N/A"}\n\n`;
    }

    doc += `This certification confirms that the above dimensions are accurate and verified `;
    doc += `by the manufacturer. These dimensions should be used for all shipping calculations.\n\n`;

    doc += `Certification Authority: ${cert.certificationAuthority || cert.manufacturer}\n`;

    return doc;
  }

  /**
   * Generate evidence index
   */
  private static generateEvidenceIndex(
    caseData: any,
    certification: any,
    attachmentsByType: Record<string, any[]>
  ): string {
    let index = `EVIDENCE INDEX\n`;
    index += `==============\n\n`;
    index += `Case: ${caseData.caseNumber}\n`;
    index += `Tracking: ${caseData.trackingNumber}\n`;
    index += `Carrier: ${caseData.carrier}\n\n`;

    index += `DOCUMENT LIST\n`;
    index += `-------------\n\n`;

    index += `00-COVER-LETTER.txt\n`;
    index += `  Cover letter addressed to carrier claims department\n\n`;

    index += `01-CASE-SUMMARY.txt\n`;
    index += `  Complete case details and dispute information\n\n`;

    let appendixLetter = "A";

    if (certification) {
      index += `APPENDIX-${appendixLetter}-MANUFACTURER-CERTIFICATION.txt\n`;
      index += `  Official manufacturer certification of product dimensions\n`;
      index += `  Product: ${certification.productName}\n`;
      index += `  Manufacturer: ${certification.manufacturer}\n\n`;
      appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    }

    if (attachmentsByType["invoice"]) {
      index += `APPENDIX-${appendixLetter}-INVOICE-*.pdf\n`;
      index += `  Carrier invoice showing dimensional weight adjustment\n`;
      index += `  Count: ${attachmentsByType["invoice"].length}\n\n`;
      appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    }

    if (attachmentsByType["delivery_photo"]) {
      index += `APPENDIX-${appendixLetter}-DELIVERY-PHOTO-*.jpg\n`;
      index += `  Carrier's own delivery photo showing actual package\n`;
      index += `  Count: ${attachmentsByType["delivery_photo"].length}\n\n`;
      appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    }

    if (attachmentsByType["shipstation_record"]) {
      index += `APPENDIX-${appendixLetter}-SHIPSTATION-RECORD-*.pdf\n`;
      index += `  ShipStation shipping record with actual dimensions\n`;
      index += `  Count: ${attachmentsByType["shipstation_record"].length}\n\n`;
      appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    }

    if (attachmentsByType["3pl_docs"]) {
      index += `APPENDIX-${appendixLetter}-3PL-DOCUMENTATION-*.pdf\n`;
      index += `  Third-party logistics provider verification\n`;
      index += `  Count: ${attachmentsByType["3pl_docs"].length}\n\n`;
      appendixLetter = String.fromCharCode(appendixLetter.charCodeAt(0) + 1);
    }

    if (attachmentsByType["other"]) {
      index += `APPENDIX-${appendixLetter}-SUPPORTING-DOC-*.pdf\n`;
      index += `  Additional supporting documentation\n`;
      index += `  Count: ${attachmentsByType["other"].length}\n\n`;
    }

    index += `EVIDENCE-INDEX.txt (this file)\n`;
    index += `  Complete listing of all evidence documents\n\n`;

    index += `Total Documents: ${this.countTotalDocuments(certification, attachmentsByType)}\n`;
    index += `Package Generated: ${new Date().toLocaleString()}\n`;

    return index;
  }

  /**
   * Count total documents in package
   */
  private static countTotalDocuments(certification: any, attachmentsByType: Record<string, any[]>): number {
    let count = 3; // Cover letter, case summary, evidence index

    if (certification) count += 1;

    Object.values(attachmentsByType).forEach((attachments) => {
      count += attachments.length;
    });

    return count;
  }
}
