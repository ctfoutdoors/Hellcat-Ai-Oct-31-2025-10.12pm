import { PDFDocument, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import { invokeLLM } from '../_core/llm';
import fetch from 'node-fetch';

/**
 * Advanced Document Builder
 * Supports Google Docs templates, dynamic element insertion,
 * legal references, carrier terms, and evidence attachments
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  carrier?: string;
  claimType?: string;
  googleDocsId?: string;
  content: string; // Markdown or HTML template
  variables: string[]; // List of {{variable}} placeholders
}

export interface DocumentElement {
  type: 'text' | 'image' | 'certification' | 'attestation' | 'addendum' | 'legal_reference' | 'carrier_terms';
  content: string;
  position?: 'before' | 'after' | 'replace';
  anchor?: string; // Section to insert near
  metadata?: Record<string, any>;
}

export interface EvidenceAttachment {
  type: 'screenshot' | 'certification' | 'receipt' | 'tracking_proof' | 'delivery_proof' | 'other';
  url: string;
  filename: string;
  description?: string;
  capturedAt?: Date;
}

export interface LegalReference {
  type: 'ucc' | 'state_law' | 'federal_regulation' | 'carrier_terms' | 'contract_terms';
  citation: string;
  text: string;
  relevance: string;
}

export interface CarrierTerms {
  carrier: string;
  section: string;
  title: string;
  content: string;
  url?: string;
}

export interface DocumentBuildOptions {
  template: DocumentTemplate;
  caseData: Record<string, any>;
  elements: DocumentElement[];
  evidence: EvidenceAttachment[];
  legalReferences: LegalReference[];
  carrierTerms: CarrierTerms[];
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

/**
 * Fetch template from Google Docs
 */
export async function fetchGoogleDocsTemplate(docsId: string): Promise<string> {
  // Note: This requires Google Docs API setup
  // For now, return a placeholder that can be implemented with proper OAuth
  throw new Error('Google Docs integration requires API setup. Use local templates for now.');
}

/**
 * Build document with dynamic elements
 */
export async function buildDocument(options: DocumentBuildOptions): Promise<{
  content: string;
  format: 'markdown' | 'html';
}> {
  let content = options.template.content;

  // Replace template variables with case data
  for (const variable of options.template.variables) {
    const key = variable.replace(/[{}]/g, '');
    const value = options.caseData[key] || '';
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  // Insert company letterhead if provided
  if (options.companyInfo) {
    const letterhead = `
# ${options.companyInfo.name}
${options.companyInfo.address}  
Phone: ${options.companyInfo.phone} | Email: ${options.companyInfo.email}

---

`;
    content = letterhead + content;
  }

  // Insert dynamic elements
  for (const element of options.elements) {
    content = insertElement(content, element);
  }

  // Add evidence section
  if (options.evidence.length > 0) {
    content += '\n\n## Attached Evidence\n\n';
    for (const evidence of options.evidence) {
      content += `- **${evidence.type.replace(/_/g, ' ').toUpperCase()}**: ${evidence.filename}`;
      if (evidence.description) {
        content += ` - ${evidence.description}`;
      }
      content += '\n';
    }
  }

  // Add legal references section
  if (options.legalReferences.length > 0) {
    content += '\n\n## Legal References\n\n';
    for (const ref of options.legalReferences) {
      content += `### ${ref.citation}\n\n`;
      content += `${ref.text}\n\n`;
      content += `*Relevance: ${ref.relevance}*\n\n`;
    }
  }

  // Add carrier terms section
  if (options.carrierTerms.length > 0) {
    content += '\n\n## Applicable Carrier Terms\n\n';
    for (const terms of options.carrierTerms) {
      content += `### ${terms.carrier} - ${terms.title}\n\n`;
      content += `**Section ${terms.section}**\n\n`;
      content += `${terms.content}\n\n`;
      if (terms.url) {
        content += `Reference: ${terms.url}\n\n`;
      }
    }
  }

  return {
    content,
    format: 'markdown',
  };
}

/**
 * Insert element into document content
 */
function insertElement(content: string, element: DocumentElement): string {
  switch (element.type) {
    case 'text':
      return insertTextElement(content, element);
    case 'certification':
      return insertCertification(content, element);
    case 'attestation':
      return insertAttestation(content, element);
    case 'addendum':
      return insertAddendum(content, element);
    case 'legal_reference':
      return insertLegalReference(content, element);
    case 'carrier_terms':
      return insertCarrierTerms(content, element);
    default:
      return content;
  }
}

function insertTextElement(content: string, element: DocumentElement): string {
  if (element.anchor) {
    // Insert near anchor point
    const anchorRegex = new RegExp(`(${element.anchor})`, 'i');
    if (element.position === 'before') {
      return content.replace(anchorRegex, `${element.content}\n\n$1`);
    } else if (element.position === 'after') {
      return content.replace(anchorRegex, `$1\n\n${element.content}`);
    } else if (element.position === 'replace') {
      return content.replace(anchorRegex, element.content);
    }
  }
  // Default: append to end
  return content + '\n\n' + element.content;
}

function insertCertification(content: string, element: DocumentElement): string {
  const certification = `
## Certification

I hereby certify that the information provided in this dispute is true and accurate to the best of my knowledge.

${element.content}

**Signature:** _________________________  
**Name:** ${element.metadata?.signerName || '_________________________'}  
**Title:** ${element.metadata?.signerTitle || '_________________________'}  
**Date:** ${element.metadata?.date || new Date().toLocaleDateString()}
`;
  return content + '\n\n' + certification;
}

function insertAttestation(content: string, element: DocumentElement): string {
  const attestation = `
## Attestation

${element.content}

Under penalty of perjury, I declare that the foregoing is true and correct.

**Executed on:** ${element.metadata?.date || new Date().toLocaleDateString()}  
**Signature:** _________________________  
**Printed Name:** ${element.metadata?.name || '_________________________'}
`;
  return content + '\n\n' + attestation;
}

function insertAddendum(content: string, element: DocumentElement): string {
  const addendum = `
## Addendum ${element.metadata?.number || ''}

${element.metadata?.title ? `### ${element.metadata.title}\n\n` : ''}${element.content}
`;
  return content + '\n\n' + addendum;
}

function insertLegalReference(content: string, element: DocumentElement): string {
  const reference = `
### Legal Reference: ${element.metadata?.citation || 'Reference'}

${element.content}

${element.metadata?.source ? `*Source: ${element.metadata.source}*` : ''}
`;
  return content + '\n\n' + reference;
}

function insertCarrierTerms(content: string, element: DocumentElement): string {
  const terms = `
### Carrier Terms: ${element.metadata?.carrier || 'Carrier'} - ${element.metadata?.section || 'Section'}

${element.content}

${element.metadata?.url ? `Reference: ${element.metadata.url}` : ''}
`;
  return content + '\n\n' + terms;
}

/**
 * Convert markdown document to PDF with embedded images
 */
export async function convertToPDF(
  markdownContent: string,
  evidence: EvidenceAttachment[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  const margin = 50;
  const maxWidth = width - 2 * margin;
  let currentY = height - margin;

  // Parse markdown and render to PDF
  const lines = markdownContent.split('\n');
  
  for (const line of lines) {
    if (currentY < margin + 50) {
      // Add new page
      page = pdfDoc.addPage([612, 792]);
      currentY = height - margin;
    }

    // Handle headers
    if (line.startsWith('# ')) {
      const text = line.substring(2);
      page.drawText(text, {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 30;
    } else if (line.startsWith('## ')) {
      const text = line.substring(3);
      page.drawText(text, {
        x: margin,
        y: currentY,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 25;
    } else if (line.startsWith('### ')) {
      const text = line.substring(4);
      page.drawText(text, {
        x: margin,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;
    } else if (line.trim() === '---') {
      // Horizontal line
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: width - margin, y: currentY },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 15;
    } else if (line.trim()) {
      // Regular text - wrap to fit width
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, 11);
        
        if (textWidth > maxWidth) {
          if (currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y: currentY,
              size: 11,
              font: font,
              color: rgb(0, 0, 0),
            });
            currentY -= 15;
            currentLine = word;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;
      }
    } else {
      // Empty line
      currentY -= 10;
    }
  }

  // Embed evidence images
  for (const item of evidence) {
    if (item.type === 'screenshot' || item.url.match(/\.(jpg|jpeg|png)$/i)) {
      try {
        // Fetch image from URL
        const imageResponse = await fetch(item.url);
        const imageBuffer = await imageResponse.arrayBuffer();
        
        let image: PDFImage;
        if (item.url.match(/\.png$/i)) {
          image = await pdfDoc.embedPng(imageBuffer);
        } else {
          image = await pdfDoc.embedJpg(imageBuffer);
        }

        // Add new page for image
        page = pdfDoc.addPage([612, 792]);
        currentY = height - margin;

        // Add image caption
        page.drawText(`Evidence: ${item.filename}`, {
          x: margin,
          y: currentY,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        currentY -= 30;

        // Scale image to fit page
        const imageDims = image.scale(0.5);
        const scale = Math.min(
          (width - 2 * margin) / imageDims.width,
          (currentY - margin) / imageDims.height
        );
        const scaledWidth = imageDims.width * scale;
        const scaledHeight = imageDims.height * scale;

        page.drawImage(image, {
          x: margin,
          y: currentY - scaledHeight,
          width: scaledWidth,
          height: scaledHeight,
        });
        
        currentY -= scaledHeight + 20;
      } catch (error) {
        console.error(`Failed to embed image ${item.filename}:`, error);
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate AI-enhanced dispute letter with legal references
 */
export async function generateEnhancedDisputeLetter(options: {
  caseData: Record<string, any>;
  carrier: string;
  claimType: string;
  includeLegalReferences: boolean;
  includeCarrierTerms: boolean;
}): Promise<string> {
  const prompt = `Generate a professional carrier dispute letter with legal backing.

**Case Details:**
${Object.entries(options.caseData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

**Carrier:** ${options.carrier}
**Claim Type:** ${options.claimType}

**Requirements:**
1. Professional business letter format
2. Clear statement of the dispute
3. ${options.includeLegalReferences ? 'Include relevant legal references (UCC, federal regulations, state laws)' : ''}
4. ${options.includeCarrierTerms ? 'Reference applicable carrier terms and conditions' : ''}
5. Specific resolution requested with timeline
6. Professional but firm tone
7. Include sections for evidence attachments
8. Add certification and attestation sections

Generate the complete letter in Markdown format.`;

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are an expert legal correspondence writer specializing in carrier disputes. Generate professional, legally sound dispute letters with proper citations and structure.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content || '';
}
