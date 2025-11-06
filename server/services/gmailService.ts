/**
 * Gmail Integration Service using MCP
 * 
 * Handles email correspondence for carrier disputes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachments?: string[]; // URLs to attachments
}

interface SearchOptions {
  query?: string;
  maxResults?: number;
}

/**
 * Send email via Gmail MCP
 */
export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const input = {
      messages: [
        {
          to: [message.to],
          subject: message.subject,
          body: message.body,
          cc: message.cc ? [message.cc] : undefined,
          bcc: message.bcc ? [message.bcc] : undefined,
        },
      ],
    };

    const { stdout, stderr } = await execAsync(
      `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${JSON.stringify(input).replace(/'/g, "\\'")}'`
    );

    if (stderr) {
      console.error('Gmail send error:', stderr);
      return { success: false, error: stderr };
    }

    const result = JSON.parse(stdout);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Search Gmail messages
 */
export async function searchMessages(options: SearchOptions = {}): Promise<any[]> {
  try {
    const input = {
      q: options.query || '',
      max_results: options.maxResults || 50,
    };

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_search_messages --server gmail --input '${JSON.stringify(input).replace(/'/g, "\\'")}'`
    );

    const result = JSON.parse(stdout);
    return result.messages || [];
  } catch (error) {
    console.error('Failed to search messages:', error);
    return [];
  }
}

/**
 * Read email thread
 */
export async function readThread(threadId: string): Promise<any> {
  try {
    const input = {
      thread_ids: [threadId],
    };

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_read_threads --server gmail --input '${JSON.stringify(input).replace(/'/g, "\\'")}'`
    );

    const result = JSON.parse(stdout);
    return result.threads?.[0] || null;
  } catch (error) {
    console.error('Failed to read thread:', error);
    return null;
  }
}

/**
 * Send dispute letter via email
 */
export async function sendDisputeLetter(
  caseNumber: string,
  carrier: string,
  recipientEmail: string,
  letterContent: string,
  attachments?: string[]
): Promise<{ success: boolean; error?: string }> {
  const carrierNames: Record<string, string> = {
    FEDEX: 'FedEx',
    UPS: 'UPS',
    USPS: 'USPS',
    DHL: 'DHL',
    OTHER: 'Carrier',
  };

  const subject = `Formal Dispute - Case ${caseNumber} - ${carrierNames[carrier] || carrier}`;

  return await sendEmail({
    to: recipientEmail,
    subject,
    body: letterContent,
    attachments,
  });
}

/**
 * Send case update notification
 */
export async function sendCaseUpdateNotification(
  recipientEmail: string,
  caseNumber: string,
  updateMessage: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `Case Update - ${caseNumber}`;
  const body = `
Case Number: ${caseNumber}

Update:
${updateMessage}

---
This is an automated notification from the Carrier Dispute System.
  `.trim();

  return await sendEmail({
    to: recipientEmail,
    subject,
    body,
  });
}

/**
 * Search for carrier responses
 */
export async function searchCarrierResponses(carrier: string): Promise<any[]> {
  const carrierDomains: Record<string, string> = {
    FEDEX: 'fedex.com',
    UPS: 'ups.com',
    USPS: 'usps.gov',
    DHL: 'dhl.com',
  };

  const domain = carrierDomains[carrier];
  if (!domain) {
    return [];
  }

  return await searchMessages({
    query: `from:${domain} subject:(dispute OR claim OR adjustment OR refund)`,
    maxResults: 100,
  });
}
