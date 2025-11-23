import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email Sending Service
 * Uses SMTP (nodemailer) to send emails with attachments
 */
export class EmailSenderService {
  private transporter: Transporter;
  private fromAddress: string;

  constructor(config: EmailConfig) {
    this.fromAddress = config.from;
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  /**
   * Send an email
   */
  public async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      console.log('[EmailSender] Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('[EmailSender] Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send dispute letter email with PDF attachment
   */
  public async sendDisputeLetter(params: {
    to: string;
    carrierName: string;
    caseNumber: string;
    trackingNumber?: string;
    claimAmount?: number;
    pdfUrl: string;
    pdfBuffer?: Buffer;
    additionalMessage?: string;
  }): Promise<void> {
    const subject = `Dispute Letter - ${params.caseNumber}${params.trackingNumber ? ` (Tracking: ${params.trackingNumber})` : ''}`;

    const text = `
Dear ${params.carrierName} Claims Department,

Please find attached our formal dispute letter regarding case ${params.caseNumber}.

${params.trackingNumber ? `Tracking Number: ${params.trackingNumber}` : ''}
${params.claimAmount ? `Claim Amount: $${params.claimAmount.toFixed(2)}` : ''}

${params.additionalMessage || 'We request your prompt attention to this matter and look forward to a timely resolution.'}

Best regards,
Catch the Fever

---
This email was sent via the Hellcat Intelligence Platform.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #f4f4f4; padding: 20px; border-bottom: 3px solid #333; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 15px; font-size: 12px; color: #666; margin-top: 20px; }
    .details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #333; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Dispute Letter - ${params.caseNumber}</h2>
  </div>
  <div class="content">
    <p>Dear ${params.carrierName} Claims Department,</p>
    
    <p>Please find attached our formal dispute letter regarding case <strong>${params.caseNumber}</strong>.</p>
    
    <div class="details">
      ${params.trackingNumber ? `<p><strong>Tracking Number:</strong> ${params.trackingNumber}</p>` : ''}
      ${params.claimAmount ? `<p><strong>Claim Amount:</strong> $${params.claimAmount.toFixed(2)}</p>` : ''}
    </div>
    
    <p>${params.additionalMessage || 'We request your prompt attention to this matter and look forward to a timely resolution.'}</p>
    
    <p>Best regards,<br>Catch the Fever</p>
  </div>
  <div class="footer">
    This email was sent via the Hellcat Intelligence Platform.
  </div>
</body>
</html>
    `.trim();

    const attachments: SendEmailOptions['attachments'] = [];

    if (params.pdfBuffer) {
      // Use buffer if provided
      attachments.push({
        filename: `Dispute-Letter-${params.caseNumber}.pdf`,
        content: params.pdfBuffer,
        contentType: 'application/pdf',
      });
    } else {
      // Use URL if buffer not provided
      attachments.push({
        filename: `Dispute-Letter-${params.caseNumber}.pdf`,
        path: params.pdfUrl,
        contentType: 'application/pdf',
      });
    }

    await this.sendEmail({
      to: params.to,
      subject,
      text,
      html,
      attachments,
    });
  }

  /**
   * Verify SMTP connection
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('[EmailSender] SMTP connection verified');
      return true;
    } catch (error) {
      console.error('[EmailSender] SMTP connection failed:', error);
      return false;
    }
  }
}

/**
 * Create email sender service from environment variables
 */
export function createEmailSender(): EmailSenderService | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    console.log('[EmailSender] SMTP not configured (missing SMTP_HOST, SMTP_USER, SMTP_PASS, or SMTP_FROM)');
    return null;
  }

  const config: EmailConfig = {
    host,
    port: parseInt(port || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    from,
  };

  return new EmailSenderService(config);
}

/**
 * Get carrier email addresses
 */
export function getCarrierEmail(carrier: string): string {
  const carrierEmails: Record<string, string> = {
    FEDEX: 'billing.disputes@fedex.com',
    UPS: 'claims@ups.com',
    USPS: 'claims@usps.com',
    DHL: 'claims@dhl.com',
  };

  return carrierEmails[carrier.toUpperCase()] || '';
}
