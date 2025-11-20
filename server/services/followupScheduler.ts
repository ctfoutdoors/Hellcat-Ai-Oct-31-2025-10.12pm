import { getDb } from '../db';
import { scheduledFollowups } from '../../drizzle/schema';
import { and, eq, lte } from 'drizzle-orm';
import { sendEmailViaGmail } from '../integrations/gmail-send';

/**
 * Schedule automatic follow-up emails for a case
 * Creates 3, 7, and 14-day follow-ups
 */
export async function scheduleFollowUps(params: {
  caseId: number;
  recipientEmail: string;
  caseNumber: string;
  title: string;
  carrier: string;
  trackingNumber?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();
  const followupSchedules = [
    { days: 3, type: '3_day' as const },
    { days: 7, type: '7_day' as const },
    { days: 14, type: '14_day' as const },
  ];

  const scheduled: any[] = [];

  for (const schedule of followupSchedules) {
    const scheduledFor = new Date(now);
    scheduledFor.setDate(scheduledFor.getDate() + schedule.days);

    const emailSubject = `Follow-up: Case #${params.caseNumber} - ${schedule.days} Day Check-in`;
    const emailBody = `Dear Carrier Representative,

This is a follow-up regarding our dispute case:

Case Number: ${params.caseNumber}
Issue: ${params.title}
Carrier: ${params.carrier}
${params.trackingNumber ? `Tracking Number: ${params.trackingNumber}` : ''}

It has been ${schedule.days} days since we filed this dispute. We kindly request an update on the status of this case and the expected timeline for resolution.

Please respond at your earliest convenience with any updates or additional information required to process this claim.

Thank you for your attention to this matter.

Best regards,
Hellcat Intelligence Team`;

    const [result] = await db.insert(scheduledFollowups).values({
      caseId: params.caseId,
      scheduledFor,
      followupType: schedule.type,
      emailSubject,
      emailBody,
      recipientEmail: params.recipientEmail,
      status: 'pending',
      createdBy: params.createdBy,
    });

    scheduled.push({
      id: result.insertId,
      scheduledFor,
      type: schedule.type,
    });
  }

  return scheduled;
}

/**
 * Process pending follow-ups that are due
 * This should be called periodically (e.g., every hour)
 */
export async function processPendingFollowups() {
  const db = await getDb();
  if (!db) {
    console.warn('[FollowupScheduler] Database not available');
    return { processed: 0, failed: 0 };
  }

  const now = new Date();
  
  // Get all pending follow-ups that are due
  const pendingFollowups = await db
    .select()
    .from(scheduledFollowups)
    .where(
      and(
        eq(scheduledFollowups.status, 'pending'),
        lte(scheduledFollowups.scheduledFor, now)
      )
    )
    .limit(50); // Process in batches

  let processed = 0;
  let failed = 0;

  for (const followup of pendingFollowups) {
    try {
      // Send the email
      await sendEmailViaGmail({
        to: [followup.recipientEmail],
        subject: followup.emailSubject,
        content: followup.emailBody,
      });

      // Mark as sent
      await db
        .update(scheduledFollowups)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(scheduledFollowups.id, followup.id));

      processed++;
      console.log(`[FollowupScheduler] Sent follow-up #${followup.id} for case #${followup.caseId}`);
    } catch (error: any) {
      // Mark as failed
      await db
        .update(scheduledFollowups)
        .set({
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
        })
        .where(eq(scheduledFollowups.id, followup.id));

      failed++;
      console.error(`[FollowupScheduler] Failed to send follow-up #${followup.id}:`, error);
    }
  }

  return { processed, failed };
}

/**
 * Cancel scheduled follow-ups for a case
 */
export async function cancelFollowUps(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(scheduledFollowups)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(scheduledFollowups.caseId, caseId),
        eq(scheduledFollowups.status, 'pending')
      )
    );

  return { success: true };
}

/**
 * Get scheduled follow-ups for a case
 */
export async function getScheduledFollowups(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  return await db
    .select()
    .from(scheduledFollowups)
    .where(eq(scheduledFollowups.caseId, caseId))
    .orderBy(scheduledFollowups.scheduledFor);
}

// Start the periodic processor (runs every hour)
let processorInterval: NodeJS.Timeout | null = null;

export function startFollowupProcessor() {
  if (processorInterval) {
    console.log('[FollowupScheduler] Processor already running');
    return;
  }

  console.log('[FollowupScheduler] Starting periodic processor (1 hour interval)');
  
  // Run immediately on start
  processPendingFollowups().catch(error => {
    console.error('[FollowupScheduler] Error in initial run:', error);
  });

  // Then run every hour
  processorInterval = setInterval(() => {
    processPendingFollowups().catch(error => {
      console.error('[FollowupScheduler] Error in periodic run:', error);
    });
  }, 60 * 60 * 1000); // 1 hour
}

export function stopFollowupProcessor() {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log('[FollowupScheduler] Processor stopped');
  }
}
