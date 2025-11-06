/**
 * Workflow Automation Service
 * 
 * Handles automated triggers and notifications based on case events
 */

interface WorkflowTrigger {
  event: string;
  condition?: (data: any) => boolean;
  actions: Array<(data: any) => Promise<void>>;
}

interface NotificationConfig {
  type: 'EMAIL' | 'PUSH' | 'SMS';
  recipient: string;
  template: string;
  data: any;
}

/**
 * Workflow triggers registry
 */
const workflowTriggers: Map<string, WorkflowTrigger> = new Map();

/**
 * Register a workflow trigger
 */
export function registerWorkflowTrigger(trigger: WorkflowTrigger): void {
  workflowTriggers.set(trigger.event, trigger);
}

/**
 * Execute workflow for an event
 */
export async function executeWorkflow(event: string, data: any): Promise<void> {
  const trigger = workflowTriggers.get(event);
  
  if (!trigger) {
    return; // No trigger registered for this event
  }

  // Check condition if specified
  if (trigger.condition && !trigger.condition(data)) {
    return; // Condition not met
  }

  // Execute all actions
  for (const action of trigger.actions) {
    try {
      await action(data);
    } catch (error) {
      console.error(`Workflow action failed for event ${event}:`, error);
    }
  }
}

/**
 * Send notification
 */
export async function sendNotification(config: NotificationConfig): Promise<void> {
  // This would integrate with notification service
  console.log(`Sending ${config.type} notification to ${config.recipient}`);
  console.log(`Template: ${config.template}`);
  console.log(`Data:`, config.data);
}

/**
 * Auto-create case from audit result
 */
export async function autoCreateCaseFromAudit(auditResult: any): Promise<{ caseId: number }> {
  // This would create a case automatically when audit finds overcharge
  return { caseId: 0 };
}

/**
 * Auto-send follow-up reminder
 */
export async function autoSendFollowUpReminder(caseData: any): Promise<void> {
  const daysSinceLastUpdate = Math.floor(
    (Date.now() - new Date(caseData.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastUpdate >= 7) {
    await sendNotification({
      type: 'EMAIL',
      recipient: caseData.assignedTo || 'admin@example.com',
      template: 'follow-up-reminder',
      data: {
        caseNumber: caseData.caseNumber,
        daysSinceUpdate: daysSinceLastUpdate,
      },
    });
  }
}

/**
 * Auto-escalate case based on priority and age
 */
export async function autoEscalateCase(caseData: any): Promise<void> {
  const daysOpen = Math.floor(
    (Date.now() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const escalationThresholds: Record<string, number> = {
    URGENT: 3,
    HIGH: 7,
    MEDIUM: 14,
    LOW: 30,
  };

  const threshold = escalationThresholds[caseData.priority] || 30;

  if (daysOpen >= threshold && caseData.status !== 'RESOLVED' && caseData.status !== 'CLOSED') {
    await sendNotification({
      type: 'EMAIL',
      recipient: 'manager@example.com',
      template: 'case-escalation',
      data: {
        caseNumber: caseData.caseNumber,
        priority: caseData.priority,
        daysOpen,
        threshold,
      },
    });
  }
}

/**
 * Auto-notify on deadline approaching
 */
export async function autoNotifyDeadlineApproaching(caseData: any): Promise<void> {
  if (!caseData.deadline) return;

  const daysUntilDeadline = Math.floor(
    (new Date(caseData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Send notifications at 7, 3, and 1 day before deadline
  if ([7, 3, 1].includes(daysUntilDeadline)) {
    await sendNotification({
      type: 'EMAIL',
      recipient: caseData.assignedTo || 'admin@example.com',
      template: 'deadline-reminder',
      data: {
        caseNumber: caseData.caseNumber,
        deadline: caseData.deadline,
        daysRemaining: daysUntilDeadline,
      },
    });
  }
}

/**
 * Auto-update case status based on carrier response
 */
export async function autoUpdateCaseStatus(emailData: any): Promise<void> {
  // This would parse carrier email responses and update case status
  const keywords = {
    approved: ['approved', 'refund', 'credit', 'accepted'],
    rejected: ['denied', 'rejected', 'declined', 'not eligible'],
    pending: ['review', 'investigating', 'processing'],
  };

  const emailBody = emailData.body.toLowerCase();

  for (const [status, words] of Object.entries(keywords)) {
    if (words.some(word => emailBody.includes(word))) {
      console.log(`Auto-updating case status to ${status.toUpperCase()}`);
      // Would update database here
      break;
    }
  }
}

/**
 * Initialize default workflow triggers
 */
export function initializeDefaultWorkflows(): void {
  // Trigger: Case created
  registerWorkflowTrigger({
    event: 'CASE_CREATED',
    actions: [
      async (data) => {
        await sendNotification({
          type: 'EMAIL',
          recipient: data.assignedTo || 'admin@example.com',
          template: 'case-created',
          data: {
            caseNumber: data.caseNumber,
            carrier: data.carrier,
            claimedAmount: data.claimedAmount,
          },
        });
      },
    ],
  });

  // Trigger: Case status changed
  registerWorkflowTrigger({
    event: 'CASE_STATUS_CHANGED',
    actions: [
      async (data) => {
        await sendNotification({
          type: 'EMAIL',
          recipient: data.assignedTo || 'admin@example.com',
          template: 'status-changed',
          data: {
            caseNumber: data.caseNumber,
            oldStatus: data.oldStatus,
            newStatus: data.newStatus,
          },
        });
      },
    ],
  });

  // Trigger: Audit found overcharge
  registerWorkflowTrigger({
    event: 'AUDIT_OVERCHARGE_FOUND',
    condition: (data) => data.difference > 10, // Only if overcharge > $10
    actions: [
      async (data) => {
        await autoCreateCaseFromAudit(data);
        await sendNotification({
          type: 'EMAIL',
          recipient: 'admin@example.com',
          template: 'overcharge-detected',
          data: {
            trackingNumber: data.trackingNumber,
            carrier: data.carrier,
            difference: data.difference,
          },
        });
      },
    ],
  });

  // Trigger: Delivery guarantee missed
  registerWorkflowTrigger({
    event: 'DELIVERY_GUARANTEE_MISSED',
    actions: [
      async (data) => {
        await autoCreateCaseFromAudit(data);
        await sendNotification({
          type: 'EMAIL',
          recipient: 'admin@example.com',
          template: 'delivery-guarantee-missed',
          data: {
            trackingNumber: data.trackingNumber,
            carrier: data.carrier,
            promisedDate: data.promisedDate,
            actualDate: data.actualDate,
            refundAmount: data.refundAmount,
          },
        });
      },
    ],
  });
}
