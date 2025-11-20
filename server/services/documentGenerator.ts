import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { invokeLLM } from '../_core/llm';

interface DisputeLetterData {
  caseNumber: string;
  title: string;
  description?: string;
  carrier: string;
  trackingNumber?: string;
  claimAmount?: string;
  customerName?: string;
  customerEmail?: string;
  shipDate?: string;
  deliveryDate?: string;
  orderNumber?: string;
}

/**
 * Generate a dispute letter PDF using AI
 * The AI generates professional letter content based on case details
 */
export async function generateDisputeLetter(data: DisputeLetterData): Promise<Buffer> {
  // Use AI to generate professional dispute letter content
  const prompt = `Generate a professional carrier dispute letter with the following details:

Case Number: ${data.caseNumber}
Issue: ${data.title}
Description: ${data.description || 'Not provided'}
Carrier: ${data.carrier}
Tracking Number: ${data.trackingNumber || 'Not provided'}
Claim Amount: ${data.claimAmount ? `$${data.claimAmount}` : 'Not specified'}
Customer: ${data.customerName || 'Not provided'}
Order Number: ${data.orderNumber || 'Not provided'}

Please write a formal, professional dispute letter that:
1. States the issue clearly
2. Provides relevant tracking and order details
3. Requests resolution or refund
4. Maintains a professional but firm tone
5. Includes a clear call to action

Format the letter with proper business letter structure (date, greeting, body, closing).`;

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are a professional business letter writer specializing in carrier dispute resolution. Write clear, concise, and effective dispute letters.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const letterContent = response.choices[0].message.content || '';

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { width, height } = page.getSize();

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add header
  const headerY = height - 50;
  page.drawText('CARRIER DISPUTE LETTER', {
    x: 50,
    y: headerY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Add case number
  page.drawText(`Case #${data.caseNumber}`, {
    x: 50,
    y: headerY - 20,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add horizontal line
  page.drawLine({
    start: { x: 50, y: headerY - 30 },
    end: { x: width - 50, y: headerY - 30 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Add letter content
  const contentY = headerY - 60;
  const maxWidth = width - 100;
  const lineHeight = 14;
  const fontSize = 11;

  // Split content into lines that fit the page width
  const words = letterContent.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, split it
        lines.push(word);
        currentLine = '';
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw text lines
  let currentY = contentY;
  for (const line of lines) {
    if (currentY < 50) {
      // Need a new page
      const newPage = pdfDoc.addPage([612, 792]);
      currentY = height - 50;
      newPage.drawText(line, {
        x: 50,
        y: currentY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    } else {
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    currentY -= lineHeight;
  }

  // Add footer
  const footerY = 30;
  page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: footerY,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate email template for dispute follow-up
 */
export async function generateFollowUpEmail(data: DisputeLetterData): Promise<{
  subject: string;
  body: string;
}> {
  const prompt = `Generate a professional follow-up email for a carrier dispute case with the following details:

Case Number: ${data.caseNumber}
Issue: ${data.title}
Carrier: ${data.carrier}
Tracking Number: ${data.trackingNumber || 'Not provided'}

Write a concise, professional email that:
1. References the original dispute
2. Requests an update on the case status
3. Reiterates the urgency if claim amount is significant
4. Maintains a professional tone
5. Includes clear contact information

Provide the email in this format:
SUBJECT: [subject line]
BODY: [email body]`;

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are a professional email writer specializing in carrier dispute follow-ups. Write clear, concise, and effective follow-up emails.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const emailContent = response.choices[0].message.content || '';

  // Parse subject and body
  const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = emailContent.match(/BODY:\s*([\s\S]+)/i);

  return {
    subject: subjectMatch ? subjectMatch[1].trim() : `Follow-up: Case #${data.caseNumber}`,
    body: bodyMatch ? bodyMatch[1].trim() : emailContent,
  };
}
