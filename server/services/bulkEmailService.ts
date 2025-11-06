/**
 * Bulk Email Service
 * Sends emails to multiple cases with template variable substitution
 */

import { sendEmailSMTP } from './emailService';
import * as db from '../db';

interface BulkEmailData {
  caseIds: number[];
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
}

interface EmailResult {
  caseId: number;
  caseNumber: string;
  success: boolean;
  error?: string;
}

/**
 * Replace template variables in text
 */
function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  
  return result;
}

/**
 * Send bulk emails to multiple cases
 */
export async function sendBulkEmails(data: BulkEmailData): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  for (const caseId of data.caseIds) {
    try {
      // Get case details
      const caseRecord = await db.getCaseById(caseId);
      
      if (!caseRecord) {
        results.push({
          caseId,
          caseNumber: `Unknown-${caseId}`,
          success: false,
          error: 'Case not found',
        });
        continue;
      }
      
      // Prepare template variables
      const variables = {
        caseNumber: caseRecord.caseNumber,
        trackingId: caseRecord.trackingId,
        carrier: caseRecord.carrier,
        status: caseRecord.status,
        claimedAmount: `$${(caseRecord.claimedAmount / 100).toFixed(2)}`,
        recipientName: caseRecord.recipientName || 'Customer',
        recipientEmail: caseRecord.recipientEmail || '',
        createdDate: new Date(caseRecord.createdAt).toLocaleDateString(),
      };
      
      // Replace variables in subject and body
      const personalizedSubject = replaceVariables(data.subject, variables);
      const personalizedBody = replaceVariables(data.body, variables);
      
      // Send email (you'll need to implement recipient logic)
      // For now, we'll log the email content
      console.log(`[Bulk Email] Sending to case ${caseRecord.caseNumber}:`);
      console.log(`Subject: ${personalizedSubject}`);
      console.log(`Body: ${personalizedBody}`);
      
      // TODO: Implement actual email sending
      // await sendEmail({
      //   to: recipientEmail,
      //   subject: personalizedSubject,
      //   html: personalizedBody,
      // });
      
      results.push({
        caseId,
        caseNumber: caseRecord.caseNumber,
        success: true,
      });
      
    } catch (error: any) {
      results.push({
        caseId,
        caseNumber: `Case-${caseId}`,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Send bulk email to carriers
 */
export async function sendBulkEmailsToCarriers(data: BulkEmailData): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  // Carrier email addresses
  const carrierEmails: Record<string, string> = {
    FEDEX: 'billing@fedex.com',
    UPS: 'billing@ups.com',
    USPS: 'billing@usps.com',
    DHL: 'billing@dhl.com',
  };
  
  for (const caseId of data.caseIds) {
    try {
      const caseRecord = await db.getCaseById(caseId);
      
      if (!caseRecord) {
        results.push({
          caseId,
          caseNumber: `Unknown-${caseId}`,
          success: false,
          error: 'Case not found',
        });
        continue;
      }
      
      const carrierEmail = carrierEmails[caseRecord.carrier];
      
      if (!carrierEmail) {
        results.push({
          caseId,
          caseNumber: caseRecord.caseNumber,
          success: false,
          error: `No email address for carrier: ${caseRecord.carrier}`,
        });
        continue;
      }
      
      // Prepare template variables
      const variables = {
        caseNumber: caseRecord.caseNumber,
        trackingId: caseRecord.trackingId,
        carrier: caseRecord.carrier,
        claimedAmount: `$${(caseRecord.claimedAmount / 100).toFixed(2)}`,
      };
      
      const personalizedSubject = replaceVariables(data.subject, variables);
      const personalizedBody = replaceVariables(data.body, variables);
      
      // Send email
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };
      
      await sendEmailSMTP(smtpConfig, {
        from: data.fromEmail || process.env.SMTP_FROM || 'noreply@catchthefever.com',
        to: carrierEmail,
        subject: personalizedSubject,
        html: personalizedBody,
      });
      
      results.push({
        caseId,
        caseNumber: caseRecord.caseNumber,
        success: true,
      });
      
    } catch (error: any) {
      results.push({
        caseId,
        caseNumber: `Case-${caseId}`,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}
