/**
 * Notification Service
 * 
 * Real-time notifications for case updates and system events
 */

interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

class NotificationService {
  private notifications: Map<string, Notification[]>;
  private subscribers: Map<string, Set<(notification: Notification) => void>>;

  constructor() {
    this.notifications = new Map();
    this.subscribers = new Map();
  }

  /**
   * Send notification to user
   */
  send(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Notification {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      userId,
      read: false,
      createdAt: new Date(),
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(fullNotification);

    // Notify subscribers
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      userSubscribers.forEach(callback => callback(fullNotification));
    }

    return fullNotification;
  }

  /**
   * Get notifications for user
   */
  getNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];
    
    if (unreadOnly) {
      return userNotifications.filter(n => !n.read);
    }
    
    return userNotifications;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    userNotifications.forEach(n => n.read = true);
  }

  /**
   * Delete notification
   */
  delete(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    const index = userNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      userNotifications.splice(index, 1);
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribe(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(userId)?.delete(callback);
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old notifications
   */
  cleanup(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.notifications.forEach((notifications, userId) => {
      const filtered = notifications.filter(n => n.createdAt >= cutoffDate);
      this.notifications.set(userId, filtered);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

/**
 * Notification templates
 */
export const notificationTemplates = {
  caseCreated: (caseNumber: string) => ({
    type: 'SUCCESS' as const,
    title: 'Case Created',
    message: `New case ${caseNumber} has been created successfully.`,
    link: `/cases/${caseNumber}`,
  }),

  caseUpdated: (caseNumber: string, field: string) => ({
    type: 'INFO' as const,
    title: 'Case Updated',
    message: `Case ${caseNumber} ${field} has been updated.`,
    link: `/cases/${caseNumber}`,
  }),

  caseResolved: (caseNumber: string, amount: number) => ({
    type: 'SUCCESS' as const,
    title: 'Case Resolved',
    message: `Case ${caseNumber} has been resolved. Recovered: $${(amount / 100).toFixed(2)}`,
    link: `/cases/${caseNumber}`,
  }),

  caseRejected: (caseNumber: string) => ({
    type: 'ERROR' as const,
    title: 'Case Rejected',
    message: `Case ${caseNumber} has been rejected by the carrier.`,
    link: `/cases/${caseNumber}`,
  }),

  deadlineApproaching: (caseNumber: string, daysRemaining: number) => ({
    type: 'WARNING' as const,
    title: 'Deadline Approaching',
    message: `Case ${caseNumber} deadline in ${daysRemaining} days.`,
    link: `/cases/${caseNumber}`,
  }),

  overchargeDetected: (trackingNumber: string, amount: number) => ({
    type: 'WARNING' as const,
    title: 'Overcharge Detected',
    message: `Overcharge of $${(amount / 100).toFixed(2)} detected for ${trackingNumber}.`,
    link: `/audits`,
  }),

  deliveryGuaranteeMissed: (trackingNumber: string, refundAmount: number) => ({
    type: 'INFO' as const,
    title: 'Delivery Guarantee Missed',
    message: `Shipment ${trackingNumber} eligible for $${(refundAmount / 100).toFixed(2)} refund.`,
    link: `/audits`,
  }),

  emailReceived: (caseNumber: string, from: string) => ({
    type: 'INFO' as const,
    title: 'Email Received',
    message: `New email from ${from} for case ${caseNumber}.`,
    link: `/cases/${caseNumber}`,
  }),

  documentGenerated: (caseNumber: string, documentType: string) => ({
    type: 'SUCCESS' as const,
    title: 'Document Generated',
    message: `${documentType} generated for case ${caseNumber}.`,
    link: `/cases/${caseNumber}`,
  }),

  batchOperationComplete: (operation: string, success: number, failed: number) => ({
    type: failed > 0 ? 'WARNING' as const : 'SUCCESS' as const,
    title: 'Batch Operation Complete',
    message: `${operation}: ${success} succeeded, ${failed} failed.`,
  }),
};

/**
 * Send notification helper
 */
export function sendNotification(
  userId: string,
  template: ReturnType<typeof notificationTemplates[keyof typeof notificationTemplates]>
): Notification {
  return notificationService.send(userId, template);
}

/**
 * Broadcast notification to all users
 */
export function broadcastNotification(
  userIds: string[],
  template: ReturnType<typeof notificationTemplates[keyof typeof notificationTemplates]>
): void {
  userIds.forEach(userId => {
    notificationService.send(userId, template);
  });
}
