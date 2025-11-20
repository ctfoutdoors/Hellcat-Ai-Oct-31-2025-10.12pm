/**
 * Email Activity Logger Service
 * Logs all email activities to case records with evidence storage
 */

import { getDb } from '../db';
import { caseActivities, emailMonitoring } from '../../drizzle/schema';
import { storagePut } from '../storage';

interface EmailActivity {
  caseId: number;
  activityType: 'email_sent' | 'email_received' | 'email_failed';
  description: string;
  metadata: {
    messageId?: string;
    threadId?: string;
    from?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    body?: string;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
      size: number;
    }>;
    error?: string;
  };
  performedBy?: number;
}

/**
 * Log email activity to case record
 */
export async function logEmailActivity(activity: EmailActivity): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Insert activity record
    const result = await db.insert(caseActivities).values({
      caseId: activity.caseId,
      activityType: activity.activityType,
      description: activity.description,
      metadata: activity.metadata,
      performedBy: activity.performedBy,
      createdAt: new Date(),
    });

    const activityId = Number(result.insertId);

    // Store email evidence as JSON file in S3
    if (activity.metadata.messageId) {
      await storeEmailEvidence(activity.caseId, activity.metadata);
    }

    console.log(`[EmailActivity] Logged ${activity.activityType} for case ${activity.caseId}`);
    return activityId;
  } catch (error) {
    console.error('[EmailActivity] Failed to log activity:', error);
    throw error;
  }
}

/**
 * Store email content as evidence in S3
 */
async function storeEmailEvidence(caseId: number, emailData: EmailActivity['metadata']): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `case-${caseId}/emails/email-${emailData.messageId}-${timestamp}.json`;

    // Create evidence JSON
    const evidence = {
      messageId: emailData.messageId,
      threadId: emailData.threadId,
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: emailData.subject,
      body: emailData.body,
      attachments: emailData.attachments,
      timestamp: new Date().toISOString(),
      caseId,
    };

    // Upload to S3
    const { url } = await storagePut(
      fileName,
      JSON.stringify(evidence, null, 2),
      'application/json'
    );

    console.log(`[EmailActivity] Stored email evidence: ${url}`);
    return url;
  } catch (error) {
    console.error('[EmailActivity] Failed to store email evidence:', error);
    throw error;
  }
}

/**
 * Log sent email
 */
export async function logSentEmail(params: {
  caseId: number;
  messageId: string;
  threadId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Array<{ fileName: string; fileUrl: string; mimeType: string; size: number }>;
  performedBy?: number;
}): Promise<number> {
  return logEmailActivity({
    caseId: params.caseId,
    activityType: 'email_sent',
    description: `Sent email to ${params.to.join(', ')}: ${params.subject}`,
    metadata: {
      messageId: params.messageId,
      threadId: params.threadId,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      body: params.body,
      attachments: params.attachments,
    },
    performedBy: params.performedBy,
  });
}

/**
 * Log received email
 */
export async function logReceivedEmail(params: {
  caseId: number;
  messageId: string;
  threadId?: string;
  from: string;
  subject: string;
  body: string;
  attachments?: Array<{ fileName: string; fileUrl: string; mimeType: string; size: number }>;
}): Promise<number> {
  return logEmailActivity({
    caseId: params.caseId,
    activityType: 'email_received',
    description: `Received email from ${params.from}: ${params.subject}`,
    metadata: {
      messageId: params.messageId,
      threadId: params.threadId,
      from: params.from,
      subject: params.subject,
      body: params.body,
      attachments: params.attachments,
    },
  });
}

/**
 * Log failed email
 */
export async function logFailedEmail(params: {
  caseId: number;
  to: string[];
  subject: string;
  error: string;
  performedBy?: number;
}): Promise<number> {
  return logEmailActivity({
    caseId: params.caseId,
    activityType: 'email_failed',
    description: `Failed to send email to ${params.to.join(', ')}: ${params.error}`,
    metadata: {
      to: params.to,
      subject: params.subject,
      error: params.error,
    },
    performedBy: params.performedBy,
  });
}

/**
 * Get email activities for a case
 */
export async function getCaseEmailActivities(caseId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const activities = await db
      .select()
      .from(caseActivities)
      .where(sql`case_id = ${caseId} AND activity_type IN ('email_sent', 'email_received', 'email_failed')`)
      .orderBy(desc(caseActivities.createdAt));

    return activities;
  } catch (error) {
    console.error('[EmailActivity] Failed to get email activities:', error);
    return [];
  }
}

/**
 * Track email in monitoring table
 */
export async function trackReceivedEmail(params: {
  emailId: string;
  fromAddress: string;
  subject: string;
  receivedAt: Date;
  caseId?: number;
  trackingNumber?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    await db.insert(emailMonitoring).values({
      emailId: params.emailId,
      fromAddress: params.fromAddress,
      subject: params.subject,
      receivedAt: params.receivedAt,
      caseId: params.caseId,
      trackingNumber: params.trackingNumber,
      isProcessed: false,
      createdAt: new Date(),
    });

    console.log(`[EmailMonitoring] Tracked email ${params.emailId} from ${params.fromAddress}`);
  } catch (error) {
    console.error('[EmailMonitoring] Failed to track email:', error);
  }
}

// Import sql and desc from drizzle-orm
import { sql, desc } from 'drizzle-orm';
