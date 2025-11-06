/**
 * PDF Compilation Service
 * Compiles multiple documents into a single PDF evidence package
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import axios from 'axios';
import * as db from '../db';

interface EvidenceDocument {
  title: string;
  content: Buffer | string;
  type: 'pdf' | 'image' | 'text';
}

export class PDFCompilationService {
  /**
   * Compile all evidence into a single PDF
   */
  static async compileEvidencePackage(caseId: number): Promise<Buffer> {
    const caseRecord = await db.getCaseById(caseId);
    
    if (!caseRecord) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 1. Add cover page
    await this.addCoverPage(pdfDoc, caseRecord, font, boldFont);

    // 2. Add table of contents
    const tocPage = pdfDoc.addPage();
    let yPosition = tocPage.getHeight() - 50;
    
    tocPage.drawText('Table of Contents', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 40;
    const appendices = [
      'Appendix A: Manufacturer Certification',
      'Appendix B: Original Invoice',
      'Appendix C: Delivery Photos',
      'Appendix D: ShipStation Record',
      'Appendix E: Correspondence',
    ];
    
    appendices.forEach((item, index) => {
      tocPage.drawText(`${index + 1}. ${item}`, {
        x: 70,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
    });

    // 3. Add case attachments
    const attachments = await db.getCaseAttachments(caseId);
    
    for (const attachment of attachments) {
      try {
        // Add section header
        const sectionPage = pdfDoc.addPage();
        sectionPage.drawText(`Appendix: ${attachment.fileName}`, {
          x: 50,
          y: sectionPage.getHeight() - 50,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        // If attachment is a PDF, merge it
        if (attachment.fileType === 'application/pdf' && attachment.fileUrl) {
          try {
            const response = await axios.get(attachment.fileUrl, {
              responseType: 'arraybuffer',
            });
            const attachmentPdf = await PDFDocument.load(response.data);
            const copiedPages = await pdfDoc.copyPages(
              attachmentPdf,
              attachmentPdf.getPageIndices()
            );
            copiedPages.forEach((page) => pdfDoc.addPage(page));
          } catch (error) {
            console.error(`Failed to load PDF attachment: ${attachment.fileName}`, error);
          }
        }
        
        // If attachment is an image, embed it
        else if (attachment.fileType?.startsWith('image/') && attachment.fileUrl) {
          try {
            const response = await axios.get(attachment.fileUrl, {
              responseType: 'arraybuffer',
            });
            
            let image;
            if (attachment.fileType === 'image/png') {
              image = await pdfDoc.embedPng(response.data);
            } else if (attachment.fileType === 'image/jpeg' || attachment.fileType === 'image/jpg') {
              image = await pdfDoc.embedJpg(response.data);
            }
            
            if (image) {
              const imagePage = pdfDoc.addPage();
              const pageWidth = imagePage.getWidth();
              const pageHeight = imagePage.getHeight();
              
              // Scale image to fit page
              const scale = Math.min(
                (pageWidth - 100) / image.width,
                (pageHeight - 100) / image.height
              );
              
              const scaledWidth = image.width * scale;
              const scaledHeight = image.height * scale;
              
              imagePage.drawImage(image, {
                x: (pageWidth - scaledWidth) / 2,
                y: (pageHeight - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
              });
            }
          } catch (error) {
            console.error(`Failed to load image attachment: ${attachment.fileName}`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing attachment ${attachment.fileName}:`, error);
      }
    }

    // 4. Add final page with contact information
    const finalPage = pdfDoc.addPage();
    let finalY = finalPage.getHeight() - 50;
    
    finalPage.drawText('Contact Information', {
      x: 50,
      y: finalY,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    finalY -= 40;
    
    const contactInfo = [
      'For questions regarding this evidence package:',
      '',
      'Catch The Fever Outdoors LLC',
      'Email: support@catchthefever.com',
      'Phone: (919) 555-0100',
      '',
      `Case Number: ${caseRecord.caseNumber}`,
      `Generated: ${new Date().toLocaleDateString()}`,
    ];
    
    contactInfo.forEach((line) => {
      finalPage.drawText(line, {
        x: 50,
        y: finalY,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
      finalY -= 20;
    });

    // Save and return PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Add cover page to PDF
   */
  private static async addCoverPage(
    pdfDoc: PDFDocument,
    caseRecord: any,
    font: any,
    boldFont: any
  ) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 100;

    // Title
    page.drawText('EVIDENCE PACKAGE', {
      x: 50,
      y: y,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    y -= 40;
    page.drawText('Carrier Dispute Documentation', {
      x: 50,
      y: y,
      size: 16,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 60;

    // Case details
    const details = [
      { label: 'Case Number:', value: caseRecord.caseNumber },
      { label: 'Tracking ID:', value: caseRecord.trackingId },
      { label: 'Carrier:', value: caseRecord.carrier },
      { label: 'Claimed Amount:', value: `$${(caseRecord.claimedAmount / 100).toFixed(2)}` },
      { label: 'Status:', value: caseRecord.status },
      { label: 'Created:', value: new Date(caseRecord.createdAt).toLocaleDateString() },
    ];

    details.forEach(({ label, value }) => {
      page.drawText(label, {
        x: 50,
        y: y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(value || 'N/A', {
        x: 200,
        y: y,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      y -= 25;
    });

    // Footer
    page.drawText('Prepared by Catch The Fever Outdoors LLC', {
      x: 50,
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}
