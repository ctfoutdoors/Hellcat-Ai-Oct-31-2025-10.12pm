/**
 * Word Document Export Service
 * Generates .docx files for dispute letters and forms
 */

import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

interface DisputeLetterData {
  caseNumber: string;
  trackingId: string;
  carrier: string;
  adjustmentDate: string;
  originalAmount: string;
  adjustedAmount: string;
  claimedAmount: string;
  actualDimensions: string;
  carrierDimensions: string;
  serviceType: string;
  customerName?: string;
  companyName: string;
  yourName: string;
  yourTitle: string;
  yourEmail: string;
  yourPhone: string;
  notes?: string;
}

export function generateDisputeLetterDocx(data: DisputeLetterData): Document {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const carrierAddresses: Record<string, string> = {
    FEDEX: 'FedEx Billing Department\n3680 Hacks Cross Rd\nMemphis, TN 38125',
    UPS: 'UPS Billing Department\n55 Glenlake Parkway NE\nAtlanta, GA 30328',
    USPS: 'USPS Customer Service\n475 L\'Enfant Plaza SW\nWashington, DC 20260',
    DHL: 'DHL Billing Department\n1200 South Pine Island Road\nPlantation, FL 33324',
    OTHER: 'Billing Department',
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header - Company Info
          new Paragraph({
            children: [
              new TextRun({
                text: data.companyName,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.yourName}, ${data.yourTitle}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.yourEmail} | ${data.yourPhone}`,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: today,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Recipient Address
          new Paragraph({
            children: [
              new TextRun({
                text: carrierAddresses[data.carrier] || carrierAddresses.OTHER,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Subject Line
          new Paragraph({
            children: [
              new TextRun({
                text: `RE: Formal Dispute of Dimensional Weight Adjustment - Tracking #${data.trackingId}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Salutation
          new Paragraph({
            children: [
              new TextRun({
                text: 'To Whom It May Concern:',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Body Paragraph 1
          new Paragraph({
            children: [
              new TextRun({
                text: `I am writing to formally dispute the dimensional weight adjustment applied to shipment tracking number ${data.trackingId}, which was adjusted on ${data.adjustmentDate}. Our records indicate a significant discrepancy between the actual package dimensions and those recorded by ${data.carrier}.`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Dispute Details Heading
          new Paragraph({
            children: [
              new TextRun({
                text: 'Dispute Details:',
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          // Details List
          new Paragraph({
            children: [
              new TextRun({
                text: `Case Number: ${data.caseNumber}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Tracking Number: ${data.trackingId}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Service Type: ${data.serviceType}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Original Charge: ${data.originalAmount}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Adjusted Charge: ${data.adjustedAmount}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Disputed Amount: ${data.claimedAmount}`,
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Actual Dimensions: ${data.actualDimensions}`,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.carrier} Recorded Dimensions: ${data.carrierDimensions}`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Body Paragraph 2
          new Paragraph({
            children: [
              new TextRun({
                text: 'We have thoroughly documented the actual package dimensions at the time of shipment and can provide supporting evidence including photographs, packing slips, and certification from our fulfillment center. The dimensions recorded by your automated scanning system appear to be inaccurate.',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Body Paragraph 3
          new Paragraph({
            children: [
              new TextRun({
                text: 'We request that you review this adjustment and credit our account for the disputed amount. We have attached all relevant documentation to support our claim, including:',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Evidence List
          new Paragraph({
            children: [
              new TextRun({
                text: '• Appendix A: Manufacturer Certification of Product Dimensions',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• Appendix B: Original Invoice and Packing Documentation',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• Appendix C: Photographs of Package and Measurements',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• Appendix D: ShipStation Shipment Record',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Additional Notes
          ...(data.notes
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Additional Information:',
                      bold: true,
                      size: 24,
                    }),
                  ],
                  spacing: { before: 200, after: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.notes,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ]
            : []),

          // Closing
          new Paragraph({
            children: [
              new TextRun({
                text: 'We appreciate your prompt attention to this matter and look forward to a favorable resolution within 30 days. Please contact me directly if you require any additional information.',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Signature
          new Paragraph({
            children: [
              new TextRun({
                text: 'Sincerely,',
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.yourName,
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.yourTitle,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.companyName,
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}
