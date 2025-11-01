/**
 * Reminder Service
 * Manages reminders and notifications for case follow-ups
 */

import * as db from '../db';
import { sendEmailSMTP } from './emailService';

interface Reminder {
  id: string;
  caseId: number;
  type: 'follow_up' | 'deadline' | 'status_check' | 'document_needed' | 'custom';
  title: string;
  description: string;
  dueDate: Date;
  notifyVia: ('email' | 'sms' | 'in_app')[];
  recurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

// In-memory storage (should be moved to database)
const reminders: Map<string, Reminder> = new Map();

export class ReminderService {
  /**
   * Create a new reminder
   */
  static createReminder(params: {
    caseId: number;
    type: Reminder['type'];
    title: string;
    description: string;
    dueDate: Date;
    notifyVia: Reminder['notifyVia'];
    recurring?: boolean;
    recurringInterval?: Reminder['recurringInterval'];
  }): Reminder {
    const reminder: Reminder = {
      id: Date.now().toString(),
      caseId: params.caseId,
      type: params.type,
      title: params.title,
      description: params.description,
      dueDate: params.dueDate,
      notifyVia: params.notifyVia,
      recurring: params.recurring || false,
      recurringInterval: params.recurringInterval,
      completed: false,
      createdAt: new Date(),
    };

    reminders.set(reminder.id, reminder);
    return reminder;
  }

  /**
   * Get all reminders for a case
   */
  static getRemindersByCase(caseId: number): Reminder[] {
    return Array.from(reminders.values())
      .filter(r => r.caseId === caseId)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get all upcoming reminders
   */
  static getUpcomingReminders(daysAhead: number = 7): Reminder[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Array.from(reminders.values())
      .filter(r => !r.completed && r.dueDate >= now && r.dueDate <= futureDate)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get overdue reminders
   */
  static getOverdueReminders(): Reminder[] {
    const now = new Date();

    return Array.from(reminders.values())
      .filter(r => !r.completed && r.dueDate < now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Mark reminder as completed
   */
  static completeReminder(id: string): Reminder | null {
    const reminder = reminders.get(id);
    
    if (!reminder) {
      return null;
    }

    reminder.completed = true;
    reminder.completedAt = new Date();

    // If recurring, create next reminder
    if (reminder.recurring && reminder.recurringInterval) {
      const nextDueDate = new Date(reminder.dueDate);
      
      switch (reminder.recurringInterval) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
      }

      this.createReminder({
        caseId: reminder.caseId,
        type: reminder.type,
        title: reminder.title,
        description: reminder.description,
        dueDate: nextDueDate,
        notifyVia: reminder.notifyVia,
        recurring: true,
        recurringInterval: reminder.recurringInterval,
      });
    }

    reminders.set(id, reminder);
    return reminder;
  }

  /**
   * Delete a reminder
   */
  static deleteReminder(id: string): boolean {
    return reminders.delete(id);
  }

  /**
   * Send reminder notifications
   */
  static async sendReminderNotifications(): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const dueReminders = this.getUpcomingReminders(1); // Due within 1 day
    const overdueReminders = this.getOverdueReminders();
    const allReminders = [...dueReminders, ...overdueReminders];

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const reminder of allReminders) {
      try {
        const caseRecord = await db.getCaseById(reminder.caseId);
        
        if (!caseRecord) {
          errors.push(`Case ${reminder.caseId} not found for reminder ${reminder.id}`);
          failed++;
          continue;
        }

        // Send email notification
        if (reminder.notifyVia.includes('email')) {
          const adminEmail = process.env.ADMIN_EMAIL || 'herve@catchthefever.com';
          const isOverdue = reminder.dueDate < new Date();

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
            from: process.env.SMTP_FROM || 'noreply@catchthefever.com',
            to: adminEmail,
            subject: `${isOverdue ? '⚠️ OVERDUE' : '🔔'} Reminder: ${reminder.title}`,
            html: `
              <h2>${isOverdue ? 'Overdue Reminder' : 'Upcoming Reminder'}</h2>
              <p><strong>Case:</strong> ${caseRecord.caseNumber}</p>
              <p><strong>Type:</strong> ${reminder.type.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Title:</strong> ${reminder.title}</p>
              <p><strong>Description:</strong> ${reminder.description}</p>
              <p><strong>Due Date:</strong> ${reminder.dueDate.toLocaleDateString()}</p>
              ${isOverdue ? `<p style="color: red;"><strong>This reminder is overdue!</strong></p>` : ''}
              <p><a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/cases/${caseRecord.id}">View Case</a></p>
            `,
          });

          sent++;
        }

        // TODO: Implement SMS notifications
        // TODO: Implement in-app notifications

      } catch (error: any) {
        errors.push(`Failed to send reminder ${reminder.id}: ${error.message}`);
        failed++;
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Auto-create reminders for cases based on rules
   */
  static async autoCreateReminders(): Promise<{
    created: number;
    reminders: Reminder[];
  }> {
    const cases = await db.getAllCases();
    const createdReminders: Reminder[] = [];

    for (const caseRecord of cases) {
      // Rule 1: Follow-up reminder for cases awaiting response
      if (caseRecord.status === 'AWAITING_RESPONSE') {
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(caseRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Create follow-up reminder every 14 days
        if (daysSinceCreated % 14 === 0) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14);

          const reminder = this.createReminder({
            caseId: caseRecord.id,
            type: 'follow_up',
            title: 'Follow up on carrier response',
            description: `Case ${caseRecord.caseNumber} has been awaiting response for ${daysSinceCreated} days. Consider following up with the carrier.`,
            dueDate,
            notifyVia: ['email', 'in_app'],
            recurring: true,
            recurringInterval: 'weekly',
          });

          createdReminders.push(reminder);
        }
      }

      // Rule 2: Document reminder for draft cases
      if (caseRecord.status === 'DRAFT') {
        const existingReminders = this.getRemindersByCase(caseRecord.id);
        const hasDocumentReminder = existingReminders.some(r => r.type === 'document_needed');

        if (!hasDocumentReminder) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 3);

          const reminder = this.createReminder({
            caseId: caseRecord.id,
            type: 'document_needed',
            title: 'Complete case documentation',
            description: `Draft case ${caseRecord.caseNumber} needs to be completed and filed.`,
            dueDate,
            notifyVia: ['email', 'in_app'],
          });

          createdReminders.push(reminder);
        }
      }
    }

    return {
      created: createdReminders.length,
      reminders: createdReminders,
    };
  }

  /**
   * Get reminder statistics
   */
  static getStatistics(): {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    upcoming: number;
  } {
    const allReminders = Array.from(reminders.values());
    const now = new Date();

    return {
      total: allReminders.length,
      completed: allReminders.filter(r => r.completed).length,
      pending: allReminders.filter(r => !r.completed).length,
      overdue: allReminders.filter(r => !r.completed && r.dueDate < now).length,
      upcoming: allReminders.filter(r => !r.completed && r.dueDate >= now).length,
    };
  }
}
