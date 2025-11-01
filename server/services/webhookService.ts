/**
 * Webhook Service
 * Handles incoming webhooks from external services (Typeform, Google Forms, etc.)
 * and outgoing webhooks for integrations (Zapier, Make, etc.)
 */

import axios from 'axios';
import * as db from '../db';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

// In-memory webhook subscriptions (should be stored in database in production)
const webhookSubscriptions: WebhookSubscription[] = [];

export class WebhookService {
  /**
   * Process incoming webhook from Typeform
   */
  static async processTypeformWebhook(payload: any): Promise<{
    success: boolean;
    caseId?: number;
    error?: string;
  }> {
    try {
      // Extract form data from Typeform payload
      const formResponse = payload.form_response;
      const answers = formResponse.answers;

      // Map Typeform fields to case fields
      const caseData: any = {
        status: 'DRAFT',
        caseType: 'DAMAGE', // Default to damage claim
        source: 'TYPEFORM',
        createdAt: new Date(formResponse.submitted_at),
      };

      // Extract answers based on field types
      for (const answer of answers) {
        const fieldRef = answer.field.ref;
        
        switch (fieldRef) {
          case 'tracking_number':
            caseData.trackingId = answer.text;
            break;
          case 'carrier':
            caseData.carrier = answer.choice?.label?.toUpperCase();
            break;
          case 'recipient_name':
            caseData.recipientName = answer.text;
            break;
          case 'recipient_email':
            caseData.recipientEmail = answer.email;
            break;
          case 'recipient_phone':
            caseData.recipientPhone = answer.phone_number;
            break;
          case 'order_number':
            caseData.orderNumber = answer.text;
            break;
          case 'damage_description':
            caseData.damageDescription = answer.text;
            break;
          case 'damage_type':
            caseData.damageType = answer.choices?.map((c: any) => c.label).join(',');
            break;
          case 'claimed_amount':
            caseData.claimedAmount = Math.round(parseFloat(answer.number) * 100);
            break;
        }
      }

      // Create case in database
      const newCase = await db.createCase(caseData);

      // Trigger outgoing webhooks
      await this.triggerWebhooks('case.created', {
        caseId: newCase.id,
        caseNumber: newCase.caseNumber,
        source: 'typeform',
      });

      return {
        success: true,
        caseId: newCase.id,
      };
    } catch (error: any) {
      console.error('Typeform webhook processing error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process incoming webhook from Google Sheets (via Zapier/Make)
   */
  static async processGoogleSheetsWebhook(payload: any): Promise<{
    success: boolean;
    caseId?: number;
    error?: string;
  }> {
    try {
      // Map Google Sheets columns to case fields
      const caseData: any = {
        trackingId: payload.tracking_number,
        carrier: payload.carrier?.toUpperCase(),
        recipientName: payload.recipient_name,
        recipientEmail: payload.recipient_email,
        recipientPhone: payload.recipient_phone,
        orderNumber: payload.order_number,
        claimedAmount: payload.claimed_amount ? Math.round(parseFloat(payload.claimed_amount) * 100) : 0,
        damageDescription: payload.damage_description,
        damageType: payload.damage_type,
        status: 'DRAFT',
        caseType: payload.case_type || 'DAMAGE',
        source: 'GOOGLE_SHEETS',
      };

      // Create case
      const newCase = await db.createCase(caseData);

      // Trigger outgoing webhooks
      await this.triggerWebhooks('case.created', {
        caseId: newCase.id,
        caseNumber: newCase.caseNumber,
        source: 'google_sheets',
      });

      return {
        success: true,
        caseId: newCase.id,
      };
    } catch (error: any) {
      console.error('Google Sheets webhook processing error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Register a webhook subscription
   */
  static registerWebhook(subscription: Omit<WebhookSubscription, 'id'>): WebhookSubscription {
    const newSubscription: WebhookSubscription = {
      id: Date.now().toString(),
      ...subscription,
    };

    webhookSubscriptions.push(newSubscription);
    return newSubscription;
  }

  /**
   * Trigger outgoing webhooks for an event
   */
  static async triggerWebhooks(event: string, data: any): Promise<void> {
    const activeSubscriptions = webhookSubscriptions.filter(
      sub => sub.active && sub.events.includes(event)
    );

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'carrier-dispute-system',
    };

    const webhookPromises = activeSubscriptions.map(async (subscription) => {
      try {
        await axios.post(subscription.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': subscription.secret || '',
          },
          timeout: 10000,
        });
        console.log(`Webhook sent to ${subscription.url} for event ${event}`);
      } catch (error: any) {
        console.error(`Failed to send webhook to ${subscription.url}:`, error.message);
      }
    });

    await Promise.allSettled(webhookPromises);
  }

  /**
   * Get all webhook subscriptions
   */
  static getWebhooks(): WebhookSubscription[] {
    return webhookSubscriptions;
  }

  /**
   * Delete a webhook subscription
   */
  static deleteWebhook(id: string): boolean {
    const index = webhookSubscriptions.findIndex(sub => sub.id === id);
    if (index !== -1) {
      webhookSubscriptions.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(url: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await axios.post(url, {
        event: 'webhook.test',
        data: { message: 'This is a test webhook' },
        timestamp: new Date().toISOString(),
        source: 'carrier-dispute-system',
      }, {
        timeout: 5000,
      });

      return {
        success: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
