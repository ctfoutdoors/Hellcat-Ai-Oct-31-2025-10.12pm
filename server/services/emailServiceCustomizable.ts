/**
 * Email Service with Template Customization
 * Handles sending emails with customizable branding
 */

import nodemailer from 'nodemailer';
import { getDb } from '../db';
import { emailTemplateSettings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

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
 * Get email template settings from database
 */
async function getEmailTemplateSettings(): Promise<any> {
  try {
    const db = await getDb();
    if (!db) return getDefaultSettings();

    const settings = await db.query.emailTemplateSettings.findFirst({
      where: eq(emailTemplateSettings.isDefault, 1),
    });

    return settings || getDefaultSettings();
  } catch (error) {
    console.error('[Email Service] Error loading template settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Get default template settings
 */
function getDefaultSettings() {
  return {
    companyName: "Catch The Fever",
    logoUrl: null,
    primaryColor: "#2c5f2d",
    secondaryColor: "#10b981",
    headerText: "New Draft Case Created",
    headerIcon: "🚨",
    footerText: null,
    ctaButtonText: "Review Case",
    ctaButtonColor: "#2c5f2d",
    fromName: "Carrier Dispute System",
    fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@catchthefever.com",
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
 * Send new draft case notification with custom branding
 */
export async function sendNewDraftCaseNotification(caseData: CaseNotificationData): Promise<boolean> {
  const settings = await getEmailTemplateSettings();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || "herve@catchthefever.com";

  const smtpConfig: SMTPConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  const subject = `${settings.headerIcon} ${settings.headerText}: ${caseData.caseNumber}`;
  const html = await generateDraftCaseEmailHtml(caseData, settings);

  const result = await sendEmailSMTP(smtpConfig, {
    from: `${settings.fromName} <${settings.fromEmail}>`,
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
 * Generate customized HTML email template
 */
async function generateDraftCaseEmailHtml(caseData: CaseNotificationData, settings: any): Promise<string> {
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
  <title>${settings.headerText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${settings.primaryColor}; padding: 30px 40px; text-align: center;">
              ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.companyName}" style="max-width: 200px; max-height: 60px; margin-bottom: 16px;" />` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${settings.headerIcon} ${settings.headerText}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                ${settings.introText || `A new draft case has been automatically created ${caseData.source ? `from <strong>${caseData.source}</strong>` : ''} and requires your review.`}
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
                    <a href="${caseData.caseUrl}" style="display: inline-block; background-color: ${settings.ctaButtonColor}; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      ${settings.ctaButtonText} →
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
                ${settings.footerText || `Carrier Dispute System by ${settings.companyName}`}<br>
                <a href="${caseData.caseUrl.split('/cases')[0]}" style="color: ${settings.primaryColor}; text-decoration: none;">View Dashboard</a>
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

export { sendEmailSMTP as sendEmail, CaseNotificationData };
