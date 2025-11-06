import { getDb } from "../db";
import { cases, certifications, attachments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from "docx";

export interface CarrierFormData {
  // Common fields
  trackingNumber: string;
  carrier: string;
  shipDate: string;
  deliveryDate?: string;
  
  // Shipper information
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperState: string;
  shipperZip: string;
  shipperPhone?: string;
  shipperEmail?: string;
  
  // Recipient information
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  
  // Package information
  actualWeight: number;
  actualLength: number;
  actualWidth: number;
  actualHeight: number;
  actualDimWeight?: number;
  
  // Billed information
  billedWeight?: number;
  billedLength?: number;
  billedWidth?: number;
  billedHeight?: number;
  billedDimWeight?: number;
  
  // Dispute information
  disputeAmount: number;
  disputeReason: string;
  disputeDetails: string;
  
  // Evidence
  hasManufacturerCert: boolean;
  has3PLVerification: boolean;
  hasDeliveryPhoto: boolean;
  hasInvoice: boolean;
}

export class FormGeneratorService {
  /**
   * Generate dispute form as Word document
   */
  static async generateDisputeFormWord(caseId: number, carrier: string): Promise<Buffer> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
      with: { attachments: true },
    });

    if (!caseData) throw new Error(`Case ${caseId} not found`);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `${carrier} Dimensional Weight Dispute Form`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Case Number: ', bold: true }),
                new TextRun(caseData.caseNumber),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Tracking Number: ', bold: true }),
                new TextRun(caseData.trackingNumber),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Dispute Amount: ', bold: true }),
                new TextRun(`$${caseData.disputeAmount || '0.00'}`),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Shipment Details',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Recipient: ', bold: true }),
                new TextRun(caseData.recipientName || 'N/A'),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Ship Date: ', bold: true }),
                new TextRun(caseData.shipDate ? new Date(caseData.shipDate).toLocaleDateString() : 'N/A'),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'Dispute Reason',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: caseData.disputeReason || 'Dimensional weight adjustment dispute',
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Generate carrier-specific dispute form from case data
   */
  static async generateDisputeForm(caseId: number, carrier: string): Promise<Buffer> {
    // Fetch case data
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
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
    if (caseData.productDimensions) {
      const dims = caseData.productDimensions as any;
      certification = await db.query.certifications.findFirst({
        where: eq(certifications.productName, caseData.productName || ""),
      });
    }

    // Map case data to form data
    const formData: CarrierFormData = {
      trackingNumber: caseData.trackingNumber,
      carrier: caseData.carrier,
      shipDate: caseData.shipDate?.toISOString().split("T")[0] || "",
      deliveryDate: caseData.deliveryDate?.toISOString().split("T")[0],
      
      shipperName: caseData.shipperName || "Catch The Fever",
      shipperAddress: caseData.shipperAddress || "",
      shipperCity: caseData.shipperCity || "",
      shipperState: caseData.shipperState || "",
      shipperZip: caseData.shipperZip || "",
      shipperPhone: caseData.shipperPhone,
      shipperEmail: caseData.shipperEmail,
      
      recipientName: caseData.recipientName || "",
      recipientAddress: caseData.recipientAddress || "",
      recipientCity: caseData.recipientCity || "",
      recipientState: caseData.recipientState || "",
      recipientZip: caseData.recipientZip || "",
      
      actualWeight: (caseData.productDimensions as any)?.weight || 0,
      actualLength: (caseData.productDimensions as any)?.length || 0,
      actualWidth: (caseData.productDimensions as any)?.width || 0,
      actualHeight: (caseData.productDimensions as any)?.height || 0,
      actualDimWeight: caseData.actualDimWeight,
      
      billedWeight: caseData.billedWeight,
      billedLength: (caseData.billedDimensions as any)?.length,
      billedWidth: (caseData.billedDimensions as any)?.width,
      billedHeight: (caseData.billedDimensions as any)?.height,
      billedDimWeight: caseData.billedDimWeight,
      
      disputeAmount: parseFloat(caseData.disputeAmount || "0"),
      disputeReason: caseData.disputeReason || "Dimensional Weight Error",
      disputeDetails: caseData.notes || "",
      
      hasManufacturerCert: !!certification,
      has3PLVerification: !!certification,
      hasDeliveryPhoto: caseData.attachments.some(a => a.type === "delivery_photo"),
      hasInvoice: caseData.attachments.some(a => a.type === "invoice"),
    };

    // Generate carrier-specific form
    switch (carrier.toUpperCase()) {
      case "FEDEX":
        return this.generateFedExForm(formData, certification);
      case "UPS":
        return this.generateUPSForm(formData, certification);
      case "USPS":
        return this.generateUSPSForm(formData, certification);
      default:
        return this.generateGenericForm(formData, certification);
    }
  }

  /**
   * Generate FedEx-specific dispute form
   */
  private static async generateFedExForm(data: CarrierFormData, cert: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(18).font("Helvetica-Bold").text("FedEx Dimensional Weight Dispute", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica").text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
    doc.moveDown(2);

    // Tracking Information
    doc.fontSize(14).font("Helvetica-Bold").text("Tracking Information");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Tracking Number: ${data.trackingNumber}`);
    doc.text(`Ship Date: ${data.shipDate}`);
    if (data.deliveryDate) doc.text(`Delivery Date: ${data.deliveryDate}`);
    doc.moveDown();

    // Shipper Information
    doc.fontSize(14).font("Helvetica-Bold").text("Shipper Information");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${data.shipperName}`);
    doc.text(`Address: ${data.shipperAddress}`);
    doc.text(`City, State ZIP: ${data.shipperCity}, ${data.shipperState} ${data.shipperZip}`);
    if (data.shipperPhone) doc.text(`Phone: ${data.shipperPhone}`);
    if (data.shipperEmail) doc.text(`Email: ${data.shipperEmail}`);
    doc.moveDown();

    // Recipient Information
    doc.fontSize(14).font("Helvetica-Bold").text("Recipient Information");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${data.recipientName}`);
    doc.text(`Address: ${data.recipientAddress}`);
    doc.text(`City, State ZIP: ${data.recipientCity}, ${data.recipientState} ${data.recipientZip}`);
    doc.moveDown();

    // Package Dimensions - Comparison Table
    doc.fontSize(14).font("Helvetica-Bold").text("Package Dimensions Comparison");
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 200;
    const col3 = 350;
    const rowHeight = 20;

    // Table headers
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Measurement", col1, tableTop);
    doc.text("Actual (Certified)", col2, tableTop);
    doc.text("FedEx Billed", col3, tableTop);

    // Table rows
    doc.font("Helvetica");
    let currentY = tableTop + rowHeight;

    doc.text("Length", col1, currentY);
    doc.text(`${data.actualLength}" (${(data.actualLength * 2.54).toFixed(2)} cm)`, col2, currentY);
    doc.text(`${data.billedLength || "N/A"}"`, col3, currentY);
    currentY += rowHeight;

    doc.text("Width", col1, currentY);
    doc.text(`${data.actualWidth}" (${(data.actualWidth * 2.54).toFixed(2)} cm)`, col2, currentY);
    doc.text(`${data.billedWidth || "N/A"}"`, col3, currentY);
    currentY += rowHeight;

    doc.text("Height", col1, currentY);
    doc.text(`${data.actualHeight}" (${(data.actualHeight * 2.54).toFixed(2)} cm)`, col2, currentY);
    doc.text(`${data.billedHeight || "N/A"}"`, col3, currentY);
    currentY += rowHeight;

    doc.text("Weight", col1, currentY);
    doc.text(`${data.actualWeight} lbs`, col2, currentY);
    doc.text(`${data.billedWeight || "N/A"} lbs`, col3, currentY);
    currentY += rowHeight;

    doc.text("Dim Weight", col1, currentY);
    doc.text(`${data.actualDimWeight || "N/A"} lbs`, col2, currentY);
    doc.text(`${data.billedDimWeight || "N/A"} lbs`, col3, currentY);

    doc.moveDown(3);

    // Dispute Details
    doc.fontSize(14).font("Helvetica-Bold").text("Dispute Details");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Dispute Amount: $${data.disputeAmount.toFixed(2)}`);
    doc.text(`Reason: ${data.disputeReason}`);
    doc.moveDown(0.5);
    doc.text("Details:", { continued: false });
    doc.text(data.disputeDetails, { align: "justify" });
    doc.moveDown();

    // Evidence Checklist
    doc.fontSize(14).font("Helvetica-Bold").text("Evidence Attached");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`[${data.hasManufacturerCert ? "X" : " "}] Manufacturer Certification`);
    doc.text(`[${data.has3PLVerification ? "X" : " "}] 3PL Verification`);
    doc.text(`[${data.hasDeliveryPhoto ? "X" : " "}] Delivery Photo`);
    doc.text(`[${data.hasInvoice ? "X" : " "}] Invoice/Billing Statement`);
    doc.moveDown();

    // Certification Details
    if (cert) {
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Manufacturer Certification Details");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Product: ${cert.productName}`);
      doc.text(`Manufacturer: ${cert.manufacturer}`);
      doc.text(`Certified Dimensions: ${cert.lengthCm}cm x ${cert.widthCm}cm x ${cert.heightCm}cm`);
      doc.text(`Shape: ${cert.shape}`);
      doc.text(`Certification Date: ${new Date(cert.certificationDate).toLocaleDateString()}`);
      doc.text(`Valid Until: ${new Date(cert.expirationDate).toLocaleDateString()}`);
    }

    // Footer
    doc.fontSize(8).font("Helvetica").text(
      "This dispute is filed in accordance with FedEx Service Guide terms and conditions.",
      50,
      doc.page.height - 50,
      { align: "center" }
    );

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }

  /**
   * Generate UPS-specific dispute form
   */
  private static async generateUPSForm(data: CarrierFormData, cert: any): Promise<Buffer> {
    // Similar to FedEx but with UPS-specific formatting
    return this.generateGenericForm(data, cert);
  }

  /**
   * Generate USPS-specific dispute form
   */
  private static async generateUSPSForm(data: CarrierFormData, cert: any): Promise<Buffer> {
    // Similar to FedEx but with USPS-specific formatting
    return this.generateGenericForm(data, cert);
  }

  /**
   * Generate generic dispute form
   */
  private static async generateGenericForm(data: CarrierFormData, cert: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(18).font("Helvetica-Bold").text("Carrier Dimensional Weight Dispute", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Tracking: ${data.trackingNumber}`);
    doc.text(`Carrier: ${data.carrier}`);
    doc.text(`Dispute Amount: $${data.disputeAmount.toFixed(2)}`);
    doc.moveDown();
    doc.text(`Actual Dimensions: ${data.actualLength}" x ${data.actualWidth}" x ${data.actualHeight}"`);
    doc.text(`Billed Dimensions: ${data.billedLength}" x ${data.billedWidth}" x ${data.billedHeight}"`);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }
}
