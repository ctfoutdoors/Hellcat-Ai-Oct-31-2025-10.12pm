import { getDb } from '../db';
import { caseActivityLogs } from '../../drizzle/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export class ActivityLogService {
  /**
   * Log an activity
   */
  async logActivity(data: {
    caseId: number;
    activityType: string;
    description: string;
    actorId?: number;
    actorName?: string;
    actorType?: 'USER' | 'SYSTEM' | 'API' | 'WORKFLOW';
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(caseActivityLogs).values({
      caseId: data.caseId,
      activityType: data.activityType as any,
      description: data.description,
      actorId: data.actorId,
      actorName: data.actorName,
      actorType: data.actorType || 'USER',
      fieldChanged: data.fieldChanged,
      oldValue: data.oldValue,
      newValue: data.newValue,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Get activity logs for a case
   */
  async getActivityLogs(caseId: number, limit = 100): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const logs = await db
      .select()
      .from(caseActivityLogs)
      .where(eq(caseActivityLogs.caseId, caseId))
      .orderBy(desc(caseActivityLogs.createdAt))
      .limit(limit);

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get recent activity across all cases
   */
  async getRecentActivity(limit = 50): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const logs = await db
      .select()
      .from(caseActivityLogs)
      .orderBy(desc(caseActivityLogs.createdAt))
      .limit(limit);

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get activity logs by type
   */
  async getActivityByType(caseId: number, activityType: string): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const logs = await db
      .select()
      .from(caseActivityLogs)
      .where(
        and(
          eq(caseActivityLogs.caseId, caseId),
          eq(caseActivityLogs.activityType, activityType as any)
        )
      )
      .orderBy(desc(caseActivityLogs.createdAt));

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get activity logs by actor
   */
  async getActivityByActor(actorId: number, limit = 100): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const logs = await db
      .select()
      .from(caseActivityLogs)
      .where(eq(caseActivityLogs.actorId, actorId))
      .orderBy(desc(caseActivityLogs.createdAt))
      .limit(limit);

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get activity logs within date range
   */
  async getActivityByDateRange(
    caseId: number,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const logs = await db
      .select()
      .from(caseActivityLogs)
      .where(
        and(
          eq(caseActivityLogs.caseId, caseId),
          gte(caseActivityLogs.createdAt, startDate)
        )
      )
      .orderBy(desc(caseActivityLogs.createdAt));

    return logs
      .filter(log => log.createdAt <= endDate)
      .map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      }));
  }

  /**
   * Log case creation
   */
  async logCaseCreated(caseId: number, actorId: number, actorName: string): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'CREATED',
      description: `Case created by ${actorName}`,
      actorId,
      actorName,
      actorType: 'USER',
    });
  }

  /**
   * Log status change
   */
  async logStatusChange(
    caseId: number,
    oldStatus: string,
    newStatus: string,
    actorId?: number,
    actorName?: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'STATUS_CHANGED',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      actorId,
      actorName,
      actorType: actorId ? 'USER' : 'SYSTEM',
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
    });
  }

  /**
   * Log assignment
   */
  async logAssignment(
    caseId: number,
    assignedToName: string,
    actorId?: number,
    actorName?: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'ASSIGNED',
      description: `Case assigned to ${assignedToName}`,
      actorId,
      actorName,
      actorType: actorId ? 'USER' : 'SYSTEM',
      fieldChanged: 'assignedTo',
      newValue: assignedToName,
    });
  }

  /**
   * Log comment
   */
  async logComment(
    caseId: number,
    actorId: number,
    actorName: string,
    commentPreview: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'COMMENTED',
      description: `${actorName} added a comment`,
      actorId,
      actorName,
      actorType: 'USER',
      metadata: { preview: commentPreview.substring(0, 100) },
    });
  }

  /**
   * Log email sent
   */
  async logEmailSent(
    caseId: number,
    recipient: string,
    subject: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'EMAIL_SENT',
      description: `Email sent to ${recipient}`,
      actorType: 'SYSTEM',
      metadata: { recipient, subject },
    });
  }

  /**
   * Log email received
   */
  async logEmailReceived(
    caseId: number,
    sender: string,
    subject: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'EMAIL_RECEIVED',
      description: `Email received from ${sender}`,
      actorType: 'SYSTEM',
      metadata: { sender, subject },
    });
  }

  /**
   * Log payment received
   */
  async logPaymentReceived(
    caseId: number,
    amount: number,
    method: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'PAYMENT_RECEIVED',
      description: `Payment of $${amount.toFixed(2)} received via ${method}`,
      actorType: 'SYSTEM',
      metadata: { amount, method },
    });
  }

  /**
   * Log workflow started
   */
  async logWorkflowStarted(
    caseId: number,
    workflowName: string
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'WORKFLOW_STARTED',
      description: `Workflow "${workflowName}" started`,
      actorType: 'WORKFLOW',
      metadata: { workflowName },
    });
  }

  /**
   * Log workflow completed
   */
  async logWorkflowCompleted(
    caseId: number,
    workflowName: string,
    success: boolean
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'WORKFLOW_COMPLETED',
      description: `Workflow "${workflowName}" ${success ? 'completed successfully' : 'failed'}`,
      actorType: 'WORKFLOW',
      metadata: { workflowName, success },
    });
  }

  /**
   * Log portal submission
   */
  async logPortalSubmission(
    caseId: number,
    carrier: string,
    success: boolean
  ): Promise<void> {
    await this.logActivity({
      caseId,
      activityType: 'PORTAL_SUBMITTED',
      description: `Case ${success ? 'successfully submitted' : 'submission failed'} to ${carrier} portal`,
      actorType: 'SYSTEM',
      metadata: { carrier, success },
    });
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(caseId: number): Promise<{
    totalActivities: number;
    byType: Record<string, number>;
    byActor: Record<string, number>;
  }> {
    const logs = await this.getActivityLogs(caseId, 1000);

    const byType: Record<string, number> = {};
    const byActor: Record<string, number> = {};

    logs.forEach(log => {
      byType[log.activityType] = (byType[log.activityType] || 0) + 1;
      
      if (log.actorName) {
        byActor[log.actorName] = (byActor[log.actorName] || 0) + 1;
      }
    });

    return {
      totalActivities: logs.length,
      byType,
      byActor,
    };
  }
}

// Singleton instance
export const activityLogService = new ActivityLogService();
