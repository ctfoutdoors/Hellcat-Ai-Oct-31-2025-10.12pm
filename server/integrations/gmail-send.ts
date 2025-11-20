/**
 * Gmail Email Sending Integration
 * Uses Gmail MCP to send emails
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Send email via Gmail MCP
 */
export async function sendEmailViaGmail(params: SendEmailParams): Promise<void> {
  try {
    const input = {
      to: params.to,
      subject: params.subject,
      body: params.content,
      ...(params.cc && { cc: params.cc }),
      ...(params.bcc && { bcc: params.bcc }),
    };

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_send_email --server gmail --input '${JSON.stringify(input).replace(/'/g, "'\\''")}'`
    );

    const result = JSON.parse(stdout);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    console.log('[Gmail] Email sent successfully:', result.messageId);
  } catch (error: any) {
    console.error('[Gmail] Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
