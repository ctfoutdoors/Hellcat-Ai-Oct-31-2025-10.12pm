import { Router } from 'express';
import { createCase } from '../db';

const router = Router();

interface WebhookEmailData {
  subject: string;
  from: string;
  to: string;
  body_plain?: string;
  body_html?: string;
  date?: string;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
    url?: string;
  }>;
}

interface ParsedCaseData {
  carrier: string;
  trackingNumber?: string;
  claimAmount?: number;
  caseType: string;
  title: string;
  description: string;
}

/**
 * Webhook endpoint for receiving emails from Make.com
 * POST /api/email-webhook
 */
router.post('/email-webhook', async (req, res) => {
  try {
    console.log('[EmailWebhook] Received email webhook');
    
    const emailData: WebhookEmailData = req.body;

    // Validate required fields
    if (!emailData.subject || !emailData.from) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject and from',
      });
    }

    // Extract case data from email
    const caseData = extractCaseData(emailData);

    if (!caseData) {
      console.log('[EmailWebhook] Email does not appear to be a carrier dispute');
      return res.status(200).json({
        success: true,
        message: 'Email received but not processed (not a carrier dispute)',
      });
    }

    // Create case in database
    const newCase = await createCase({
      title: caseData.title,
      description: caseData.description,
      carrier: caseData.carrier,
      caseType: caseData.caseType,
      trackingNumber: caseData.trackingNumber,
      claimAmount: caseData.claimAmount,
      status: 'draft', // Set to draft for manual review
      priority: 'medium',
      createdBy: 1, // System user
    });

    console.log(`[EmailWebhook] Created case ${newCase.caseNumber} from email`);

    // TODO: Attach email attachments as evidence
    // TODO: Log activity for email-created case

    return res.status(200).json({
      success: true,
      caseNumber: newCase.caseNumber,
      caseId: newCase.id,
      message: `Case ${newCase.caseNumber} created successfully`,
    });

  } catch (error) {
    console.error('[EmailWebhook] Error processing email webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Extract case data from email
 */
function extractCaseData(email: WebhookEmailData): ParsedCaseData | null {
  const subject = email.subject || '';
  const body = email.body_plain || email.body_html || '';
  const from = email.from || '';

  // Detect carrier
  const carrier = detectCarrier(from, subject, body);
  if (!carrier) {
    return null;
  }

  // Extract tracking number
  const trackingNumber = extractTrackingNumber(body, carrier);

  // Extract claim amount
  const claimAmount = extractClaimAmount(body);

  // Detect case type
  const caseType = detectCaseType(subject, body);

  // Build title and description
  const title = buildTitle(carrier, caseType, trackingNumber);
  const description = buildDescription(email, carrier, trackingNumber, claimAmount);

  return {
    carrier,
    trackingNumber,
    claimAmount,
    caseType,
    title,
    description,
  };
}

/**
 * Detect carrier from email sender or content
 */
function detectCarrier(from: string, subject: string, body: string): string | null {
  const content = `${from} ${subject} ${body}`.toLowerCase();

  if (content.includes('fedex')) return 'FEDEX';
  if (content.includes('ups')) return 'UPS';
  if (content.includes('usps') || content.includes('postal')) return 'USPS';
  if (content.includes('dhl')) return 'DHL';

  return null;
}

/**
 * Extract tracking number from email text
 */
function extractTrackingNumber(text: string, carrier: string): string | undefined {
  // FedEx: 12-14 digits
  if (carrier === 'FEDEX') {
    const match = text.match(/\b\d{12,14}\b/);
    return match ? match[0] : undefined;
  }

  // UPS: 1Z followed by 16 characters
  if (carrier === 'UPS') {
    const match = text.match(/\b1Z[A-Z0-9]{16}\b/i);
    return match ? match[0] : undefined;
  }

  // USPS: 20-22 digits
  if (carrier === 'USPS') {
    const match = text.match(/\b\d{20,22}\b/);
    return match ? match[0] : undefined;
  }

  return undefined;
}

/**
 * Extract claim amount from email text
 */
function extractClaimAmount(text: string): number | undefined {
  const patterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 100000) {
        return amount;
      }
    }
  }

  return undefined;
}

/**
 * Detect case type from email content
 */
function detectCaseType(subject: string, text: string): string {
  const content = `${subject} ${text}`.toLowerCase();

  if (content.includes('damage') || content.includes('damaged')) return 'DAMAGE';
  if (content.includes('lost') || content.includes('missing')) return 'LOST';
  if (content.includes('late') || content.includes('delay')) return 'LATE_DELIVERY';
  if (content.includes('billing') || content.includes('charge') || content.includes('invoice')) return 'ADJUSTMENTS';

  return 'OTHER';
}

/**
 * Build case title
 */
function buildTitle(carrier: string, caseType: string, trackingNumber?: string): string {
  const typeLabel = caseType.replace(/_/g, ' ').toLowerCase();
  const tracking = trackingNumber ? ` - Tracking ${trackingNumber}` : '';
  return `${carrier} ${typeLabel}${tracking}`;
}

/**
 * Build case description from email
 */
function buildDescription(
  email: WebhookEmailData,
  carrier: string,
  trackingNumber?: string,
  claimAmount?: number
): string {
  const parts = [
    `Auto-created from email received on ${email.date || new Date().toISOString()}`,
    `From: ${email.from}`,
    `Subject: ${email.subject}`,
    '',
    '--- Original Email Content ---',
    email.body_plain || email.body_html || '',
  ];

  if (trackingNumber) {
    parts.splice(3, 0, `Tracking: ${trackingNumber}`);
  }

  if (claimAmount) {
    parts.splice(3, 0, `Claim Amount: $${claimAmount.toFixed(2)}`);
  }

  if (email.attachments && email.attachments.length > 0) {
    parts.push('');
    parts.push('--- Attachments ---');
    email.attachments.forEach(att => {
      parts.push(`- ${att.filename} (${att.content_type}, ${att.size} bytes)`);
    });
  }

  return parts.join('\n');
}

export default router;
