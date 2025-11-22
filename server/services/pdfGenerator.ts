import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface DisputeLetterData {
  caseNumber: string;
  date: string;
  carrier: string;
  trackingNumber: string;
  claimAmount: number;
  description: string;
  
  // Optional fields
  customerName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  carrierAddress?: string;
  carrierCity?: string;
  carrierState?: string;
  carrierZip?: string;
  
  legalReferences?: Array<{
    citation: string;
    title: string;
    summary?: string;
  }>;
  
  carrierTerms?: Array<{
    section: string;
    content: string;
  }>;
  
  includeCertification?: boolean;
  includeAttestation?: boolean;
  customAddendums?: Array<{
    title: string;
    content: string;
  }>;
}

/**
 * Generate a professional dispute letter PDF
 */
export async function generateDisputeLetterPDF(data: DisputeLetterData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(10);
      doc.text(data.customerName || 'Sender Name', { align: 'left' });
      if (data.customerAddress) {
        doc.text(data.customerAddress);
        doc.text(`${data.customerCity || ''}, ${data.customerState || ''} ${data.customerZip || ''}`);
      }
      if (data.customerEmail) doc.text(data.customerEmail);
      if (data.customerPhone) doc.text(data.customerPhone);
      
      doc.moveDown(2);
      
      // Date
      doc.text(data.date, { align: 'left' });
      doc.moveDown(2);
      
      // Carrier address
      doc.text(`${data.carrier} Claims Department`, { align: 'left' });
      if (data.carrierAddress) {
        doc.text(data.carrierAddress);
        doc.text(`${data.carrierCity || ''}, ${data.carrierState || ''} ${data.carrierZip || ''}`);
      }
      
      doc.moveDown(2);
      
      // Subject line
      doc.fontSize(12);
      doc.font('Helvetica-Bold');
      doc.text(`RE: Formal Dispute - Case ${data.caseNumber}`, { align: 'left' });
      doc.text(`Tracking Number: ${data.trackingNumber}`, { align: 'left' });
      doc.font('Helvetica');
      doc.fontSize(10);
      
      doc.moveDown(2);
      
      // Salutation
      doc.text('To Whom It May Concern:', { align: 'left' });
      doc.moveDown();
      
      // Body - Opening paragraph
      doc.text(
        `I am writing to formally dispute the charges assessed on shipment tracking number ${data.trackingNumber}. ` +
        `The total amount in dispute is $${data.claimAmount.toFixed(2)}.`,
        { align: 'justify' }
      );
      doc.moveDown();
      
      // Description
      doc.font('Helvetica-Bold');
      doc.text('Description of Dispute:', { align: 'left' });
      doc.font('Helvetica');
      doc.moveDown(0.5);
      doc.text(data.description, { align: 'justify' });
      doc.moveDown(1.5);
      
      // Legal References (if provided)
      if (data.legalReferences && data.legalReferences.length > 0) {
        doc.font('Helvetica-Bold');
        doc.text('Legal Basis for Dispute:', { align: 'left' });
        doc.font('Helvetica');
        doc.moveDown(0.5);
        
        data.legalReferences.forEach((ref, index) => {
          doc.text(`${index + 1}. ${ref.citation} - ${ref.title}`, { align: 'left' });
          if (ref.summary) {
            doc.fontSize(9);
            doc.text(`   ${ref.summary}`, { align: 'justify', indent: 20 });
            doc.fontSize(10);
          }
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }
      
      // Carrier Terms (if provided)
      if (data.carrierTerms && data.carrierTerms.length > 0) {
        doc.font('Helvetica-Bold');
        doc.text('Applicable Carrier Terms & Conditions:', { align: 'left' });
        doc.font('Helvetica');
        doc.moveDown(0.5);
        
        data.carrierTerms.forEach((term, index) => {
          doc.text(`${index + 1}. ${term.section}`, { align: 'left' });
          doc.fontSize(9);
          doc.text(`   ${term.content}`, { align: 'justify', indent: 20 });
          doc.fontSize(10);
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }
      
      // Custom Addendums (if provided)
      if (data.customAddendums && data.customAddendums.length > 0) {
        data.customAddendums.forEach((addendum) => {
          doc.font('Helvetica-Bold');
          doc.text(addendum.title, { align: 'left' });
          doc.font('Helvetica');
          doc.moveDown(0.5);
          doc.text(addendum.content, { align: 'justify' });
          doc.moveDown(1.5);
        });
      }
      
      // Closing paragraph
      doc.text(
        `I request that you review this matter and provide a full refund of $${data.claimAmount.toFixed(2)} ` +
        `to my account within 30 days of receipt of this letter. Please provide written confirmation of your ` +
        `decision and any supporting documentation.`,
        { align: 'justify' }
      );
      doc.moveDown(1.5);
      
      // Certification (if requested)
      if (data.includeCertification) {
        doc.fontSize(9);
        doc.text(
          'I certify that the information provided in this dispute letter is true and accurate to the best of my knowledge.',
          { align: 'justify' }
        );
        doc.fontSize(10);
        doc.moveDown();
      }
      
      // Attestation (if requested)
      if (data.includeAttestation) {
        doc.fontSize(9);
        doc.text(
          'I declare under penalty of perjury under the laws of the United States of America that the foregoing is true and correct.',
          { align: 'justify' }
        );
        doc.fontSize(10);
        doc.moveDown(1.5);
      }
      
      // Signature block
      doc.text('Sincerely,', { align: 'left' });
      doc.moveDown(3);
      doc.text('_________________________________', { align: 'left' });
      doc.text(data.customerName || 'Signature', { align: 'left' });
      
      // Footer
      doc.fontSize(8);
      doc.moveDown(2);
      doc.text(
        `Case Reference: ${data.caseNumber} | Generated: ${data.date}`,
        { align: 'center' }
      );
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stream a PDF document directly to response
 */
export function streamDisputeLetterPDF(data: DisputeLetterData): Readable {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72
    }
  });

  // Same content generation as above, but return stream directly
  // (Implementation would mirror generateDisputeLetterPDF but without buffering)
  
  return doc as unknown as Readable;
}
