/**
 * Gmail Monitoring Integration
 * Uses Gmail MCP to monitor carrier emails and detect delivery issues
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

interface DeliveryException {
  carrier: string;
  trackingNumber: string;
  exceptionType: 'late_delivery' | 'delivery_exception' | 'lost_package' | 'damage';
  description: string;
  email: GmailMessage;
}

/**
 * Call Gmail MCP to list messages
 */
async function listGmailMessages(query: string, maxResults: number = 50): Promise<GmailMessage[]> {
  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_list_messages --server gmail --input '${JSON.stringify({ query, maxResults })}'`
    );
    
    const result = JSON.parse(stdout);
    return result.messages || [];
  } catch (error) {
    console.error('[Gmail] Failed to list messages:', error);
    return [];
  }
}

/**
 * Call Gmail MCP to get message content
 */
async function getGmailMessage(messageId: string): Promise<GmailMessage | null> {
  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_get_message --server gmail --input '${JSON.stringify({ messageId })}'`
    );
    
    return JSON.parse(stdout);
  } catch (error) {
    console.error('[Gmail] Failed to get message:', error);
    return null;
  }
}

/**
 * Extract tracking number from email content
 */
function extractTrackingNumber(text: string): string | null {
  // UPS: 1Z followed by 16 alphanumeric characters
  const upsMatch = text.match(/1Z[A-Z0-9]{16}/i);
  if (upsMatch) return upsMatch[0];

  // FedEx: 12-14 digits
  const fedexMatch = text.match(/\b\d{12,14}\b/);
  if (fedexMatch) return fedexMatch[0];

  // USPS: 20-22 digits
  const uspsMatch = text.match(/\b\d{20,22}\b/);
  if (uspsMatch) return uspsMatch[0];

  // DHL: 10-11 digits
  const dhlMatch = text.match(/\b\d{10,11}\b/);
  if (dhlMatch) return dhlMatch[0];

  return null;
}

/**
 * Detect carrier from email address or content
 */
function detectCarrier(from: string, subject: string, body: string): string | null {
  const text = `${from} ${subject} ${body}`.toLowerCase();

  if (text.includes('ups') || text.includes('@ups.com')) return 'ups';
  if (text.includes('fedex') || text.includes('@fedex.com')) return 'fedex';
  if (text.includes('usps') || text.includes('@usps.com')) return 'usps';
  if (text.includes('dhl') || text.includes('@dhl.com')) return 'dhl';

  return null;
}

/**
 * Detect exception type from email content
 */
function detectExceptionType(subject: string, body: string): {
  type: 'late_delivery' | 'delivery_exception' | 'lost_package' | 'damage';
  confidence: number;
} | null {
  const text = `${subject} ${body}`.toLowerCase();

  // Late delivery indicators
  if (text.match(/delay|late|postponed|rescheduled/i)) {
    return { type: 'late_delivery', confidence: 0.8 };
  }

  // Delivery exception indicators
  if (text.match(/exception|problem|issue|unable to deliver/i)) {
    return { type: 'delivery_exception', confidence: 0.9 };
  }

  // Lost package indicators
  if (text.match(/lost|missing|cannot locate|not found/i)) {
    return { type: 'lost_package', confidence: 0.85 };
  }

  // Damage indicators
  if (text.match(/damage|broken|crushed|destroyed/i)) {
    return { type: 'damage', confidence: 0.9 };
  }

  return null;
}

/**
 * Monitor Gmail for carrier emails and detect delivery exceptions
 */
export async function monitorCarrierEmails(daysBack: number = 7): Promise<DeliveryException[]> {
  const exceptions: DeliveryException[] = [];

  // Search for carrier emails
  const carriers = ['UPS', 'FedEx', 'USPS', 'DHL'];
  
  for (const carrier of carriers) {
    const query = `from:(${carrier.toLowerCase()}.com) newer_than:${daysBack}d`;
    const messages = await listGmailMessages(query, 50);

    for (const message of messages) {
      // Get full message content
      const fullMessage = await getGmailMessage(message.id);
      if (!fullMessage) continue;

      // Detect exception
      const exceptionInfo = detectExceptionType(fullMessage.subject, fullMessage.body);
      if (!exceptionInfo) continue;

      // Extract tracking number
      const trackingNumber = extractTrackingNumber(fullMessage.body);
      if (!trackingNumber) continue;

      // Detect carrier
      const detectedCarrier = detectCarrier(fullMessage.from, fullMessage.subject, fullMessage.body);
      if (!detectedCarrier) continue;

      exceptions.push({
        carrier: detectedCarrier,
        trackingNumber,
        exceptionType: exceptionInfo.type,
        description: fullMessage.subject,
        email: fullMessage,
      });
    }
  }

  return exceptions;
}

/**
 * Get Gmail monitoring status
 */
export async function getGmailMonitoringStatus() {
  return {
    enabled: true,
    lastCheck: new Date().toISOString(),
    carriersMonitored: ['UPS', 'FedEx', 'USPS', 'DHL'],
  };
}
