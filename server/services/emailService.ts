/**
 * Email Service
 * Handles sending emails via SMTP and Gmail API
 */

import nodemailer from 'nodemailer';
import { decryptCredential } from './apiService';

interface EmailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Send email via SMTP
 */
export async function sendEmailSMTP(
  smtpConfig: SMTPConfig,
  emailOptions: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = nodemailer.createTransport(smtpConfig);

    const info = await transporter.sendMail({
      from: emailOptions.from,
      to: Array.isArray(emailOptions.to) ? emailOptions.to.join(', ') : emailOptions.to,
      cc: emailOptions.cc ? (Array.isArray(emailOptions.cc) ? emailOptions.cc.join(', ') : emailOptions.cc) : undefined,
      bcc: emailOptions.bcc ? (Array.isArray(emailOptions.bcc) ? emailOptions.bcc.join(', ') : emailOptions.bcc) : undefined,
      subject: emailOptions.subject,
      html: emailOptions.html,
      text: emailOptions.text,
      attachments: emailOptions.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('[Email Service] SMTP send failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send email via Gmail API (using MCP)
 * This will use the Gmail MCP server integration
 */
export async function sendEmailGmailAPI(
  emailOptions: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // TODO: Implement Gmail API sending via MCP
    // For now, return not implemented
    return {
      success: false,
      error: 'Gmail API integration coming soon',
    };
  } catch (error: any) {
    console.error('[Email Service] Gmail API send failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(smtpConfig: SMTPConfig): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport(smtpConfig);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP test failed:', error);
    return false;
  }
}


/**
 * Case notification data interface
 */
interface CaseNotificationData {
  caseNumber: string;
  trackingNumber: string;
  carrier: string;
  disputeAmount: string;
  priority: string;
  status: string;
  recipientName?: string;
  shipDate?: Date;
  source?: string;
  caseUrl: string;
}

/**
 * Send new draft case notification to admin
 */
export async function sendNewDraftCaseNotification(caseData: CaseNotificationData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || "herve@catchthefever.com";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@catchthefever.com";

  // Get SMTP config from environment
  const smtpConfig: SMTPConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  const subject = `🚨 New Draft Case Created: ${caseData.caseNumber}`;
  const html = generateDraftCaseEmailHtml(caseData);

  const result = await sendEmailSMTP(smtpConfig, {
    from: fromEmail,
    to: adminEmail,
    subject,
    html,
  });

  if (!result.success) {
    console.log("📧 Email notification (Dev Mode - SMTP not configured):");
    console.log("To:", adminEmail);
    console.log("Subject:", subject);
    console.log("Case:", caseData.caseNumber, "-", caseData.carrier, "-", caseData.disputeAmount);
  }

  return result.success;
}

/**
 * Generate HTML email template for new draft case
 */
function generateDraftCaseEmailHtml(caseData: CaseNotificationData): string {
  const priorityColors: Record<string, string> = {
    LOW: "#10b981",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    URGENT: "#dc2626",
  };

  const priorityColor = priorityColors[caseData.priority] || "#6b7280";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Draft Case Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #2c5f2d; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🚨 New Draft Case Created
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                A new draft case has been automatically created ${caseData.source ? `from <strong>${caseData.source}</strong>` : ''} and requires your review.
              </p>

              <!-- Case Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    
                    <!-- Case Number -->
                    <div style="margin-bottom: 16px;">
                      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Case Number</div>
                      <div style="color: #111827; font-size: 18px; font-weight: 600;">${caseData.caseNumber}</div>
                    </div>

                    <!-- Priority Badge -->
                    <div style="margin-bottom: 16px;">
                      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Priority</div>
                      <span style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                        ${caseData.priority}
                      </span>
                    </div>

                    <!-- Details Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                      <tr>
                        <td width="50%" style="padding: 8px 0; vertical-align: top;">
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Tracking Number</div>
                          <div style="color: #111827; font-size: 14px; font-weight: 500;">${caseData.trackingNumber}</div>
                        </td>
                        <td width="50%" style="padding: 8px 0; vertical-align: top;">
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Carrier</div>
                          <div style="color: #111827; font-size: 14px; font-weight: 500;">${caseData.carrier}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 8px 0; vertical-align: top;">
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Dispute Amount</div>
                          <div style="color: #ef4444; font-size: 16px; font-weight: 600;">$${parseFloat(caseData.disputeAmount).toFixed(2)}</div>
                        </td>
                        <td width="50%" style="padding: 8px 0; vertical-align: top;">
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Status</div>
                          <div style="color: #111827; font-size: 14px; font-weight: 500;">${caseData.status}</div>
                        </td>
                      </tr>
                      ${caseData.recipientName ? `
                      <tr>
                        <td width="50%" style="padding: 8px 0; vertical-align: top;">
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Recipient</div>
                          <div style="color: #111827; font-size: 14px; font-weight: 500;">${caseData.recipientName}</div>
                        </td>
                        <td width="50%" style="padding: 8px 0; vertical-align: top;">
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Ship Date</div>
                          <div style="color: #111827; font-size: 14px; font-weight: 500;">${caseData.shipDate ? new Date(caseData.shipDate).toLocaleDateString() : 'N/A'}</div>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${caseData.caseUrl}" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Review Case →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                This case was automatically created and may require verification before filing. Please review the case details and update as needed.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                Carrier Dispute System by Catch The Fever<br>
                <a href="${caseData.caseUrl.split('/cases')[0]}" style="color: #2c5f2d; text-decoration: none;">View Dashboard</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send bulk notification for multiple cases
 */
export async function sendBulkCaseNotification(cases: CaseNotificationData[]): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || "herve@catchthefever.com";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@catchthefever.com";

  const smtpConfig: SMTPConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  const subject = `🚨 ${cases.length} New Draft Cases Created`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Multiple New Cases</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
    <h1 style="color: #2c5f2d; margin-bottom: 20px;">🚨 ${cases.length} New Draft Cases Created</h1>
    <p style="color: #374151; margin-bottom: 30px;">The following cases have been automatically created and require your review:</p>
    
    ${cases.map(c => `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 8px;">${c.caseNumber}</div>
        <div style="font-size: 14px; color: #6b7280;">
          ${c.carrier} • ${c.trackingNumber} • <span style="color: #ef4444; font-weight: 600;">$${parseFloat(c.disputeAmount).toFixed(2)}</span>
        </div>
        <div style="margin-top: 12px;">
          <a href="${c.caseUrl}" style="color: #2c5f2d; text-decoration: none; font-size: 14px; font-weight: 500;">Review Case →</a>
        </div>
      </div>
    `).join('')}
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="${cases[0].caseUrl.split('/cases')[0]}/cases" style="display: inline-block; background-color: #2c5f2d; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View All Cases
      </a>
    </div>
  </div>
</body>
</html>
  `.trim();

  const result = await sendEmailSMTP(smtpConfig, {
    from: fromEmail,
    to: adminEmail,
    subject,
    html,
  });

  if (!result.success) {
    console.log("📧 Bulk email notification (Dev Mode):");
    console.log("To:", adminEmail);
    console.log("Subject:", subject);
    console.log("Cases:", cases.length);
  }

  return result.success;
}
