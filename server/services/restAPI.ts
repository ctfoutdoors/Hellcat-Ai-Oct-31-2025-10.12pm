/**
 * REST API Service for Third-Party Integrations
 * 
 * Provides REST API endpoints for external systems to integrate with
 * Includes API key management, rate limiting, and webhook support
 */

interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  userId: number;
  permissions: string[]; // e.g., ['cases:read', 'cases:write', 'contacts:read']
  rateLimit: number; // requests per minute
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  usageCount: number;
}

interface APIRequest {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  statusCode: number;
  responseTime: number; // milliseconds
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

interface Webhook {
  id: string;
  userId: number;
  name: string;
  url: string;
  events: string[]; // e.g., ['case.created', 'case.updated', 'case.status_changed']
  secret: string; // For HMAC signature verification
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  statusCode?: number;
  responseTime?: number;
  success: boolean;
  error?: string;
  attempt: number;
  timestamp: Date;
}

export class RestAPIService {
  private static apiKeys: Map<string, APIKey> = new Map();
  private static requests: APIRequest[] = [];
  private static webhooks: Map<string, Webhook> = new Map();
  private static deliveries: WebhookDelivery[] = [];
  private static rateLimits: Map<string, number[]> = new Map(); // keyId -> timestamps

  /**
   * Generate new API key
   */
  static generateAPIKey(params: {
    name: string;
    userId: number;
    permissions: string[];
    rateLimit?: number;
    expiresAt?: Date;
  }): APIKey {
    const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `sk_${Buffer.from(id).toString('base64').replace(/[=+/]/g, '')}`;
    const secret = Buffer.from(
      `${Date.now()}_${Math.random().toString(36)}`
    ).toString('base64');

    const apiKey: APIKey = {
      id,
      name: params.name,
      key,
      secret,
      userId: params.userId,
      permissions: params.permissions,
      rateLimit: params.rateLimit || 60, // default 60 req/min
      isActive: true,
      createdAt: new Date(),
      expiresAt: params.expiresAt,
      usageCount: 0,
    };

    this.apiKeys.set(key, apiKey);
    return apiKey;
  }

  /**
   * Validate API key
   */
  static validateAPIKey(key: string): {
    valid: boolean;
    apiKey?: APIKey;
    error?: string;
  } {
    const apiKey = this.apiKeys.get(key);

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'API key is inactive' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    return { valid: true, apiKey };
  }

  /**
   * Check rate limit
   */
  static checkRateLimit(apiKeyId: string, rateLimit: number): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get recent requests
    let timestamps = this.rateLimits.get(apiKeyId) || [];
    timestamps = timestamps.filter(t => t > oneMinuteAgo);

    const remaining = Math.max(0, rateLimit - timestamps.length);
    const resetAt = new Date(timestamps[0] ? timestamps[0] + 60000 : now + 60000);

    if (timestamps.length >= rateLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Record this request
    timestamps.push(now);
    this.rateLimits.set(apiKeyId, timestamps);

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt,
    };
  }

  /**
   * Log API request
   */
  static logRequest(params: {
    apiKeyId: string;
    endpoint: string;
    method: APIRequest['method'];
    statusCode: number;
    responseTime: number;
    ipAddress: string;
    userAgent: string;
  }): void {
    const request: APIRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      timestamp: new Date(),
    };

    this.requests.push(request);

    // Update API key usage
    const apiKey = Array.from(this.apiKeys.values()).find(k => k.id === params.apiKeyId);
    if (apiKey) {
      apiKey.usageCount++;
      apiKey.lastUsed = new Date();
      this.apiKeys.set(apiKey.key, apiKey);
    }

    // Keep only last 10000 requests
    if (this.requests.length > 10000) {
      this.requests = this.requests.slice(-10000);
    }
  }

  /**
   * Get API key by ID
   */
  static getAPIKey(keyId: string): APIKey | undefined {
    return Array.from(this.apiKeys.values()).find(k => k.id === keyId);
  }

  /**
   * Get user's API keys
   */
  static getUserAPIKeys(userId: number): APIKey[] {
    return Array.from(this.apiKeys.values()).filter(k => k.userId === userId);
  }

  /**
   * Revoke API key
   */
  static revokeAPIKey(keyId: string, userId: number): boolean {
    const apiKey = Array.from(this.apiKeys.values()).find(
      k => k.id === keyId && k.userId === userId
    );

    if (!apiKey) return false;

    apiKey.isActive = false;
    this.apiKeys.set(apiKey.key, apiKey);
    return true;
  }

  /**
   * Create webhook
   */
  static createWebhook(params: {
    userId: number;
    name: string;
    url: string;
    events: string[];
    maxRetries?: number;
  }): Webhook {
    const id = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const secret = Buffer.from(
      `${Date.now()}_${Math.random().toString(36)}`
    ).toString('base64');

    const webhook: Webhook = {
      id,
      userId: params.userId,
      name: params.name,
      url: params.url,
      events: params.events,
      secret,
      isActive: true,
      retryCount: 0,
      maxRetries: params.maxRetries || 3,
      createdAt: new Date(),
      failureCount: 0,
    };

    this.webhooks.set(id, webhook);
    return webhook;
  }

  /**
   * Trigger webhook
   */
  static async triggerWebhook(params: {
    event: string;
    payload: Record<string, any>;
  }): Promise<void> {
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      w => w.isActive && w.events.includes(params.event)
    );

    for (const webhook of matchingWebhooks) {
      await this.deliverWebhook({
        webhookId: webhook.id,
        event: params.event,
        payload: params.payload,
        attempt: 1,
      });
    }
  }

  /**
   * Deliver webhook with retries
   */
  private static async deliverWebhook(params: {
    webhookId: string;
    event: string;
    payload: Record<string, any>;
    attempt: number;
  }): Promise<void> {
    const webhook = this.webhooks.get(params.webhookId);
    if (!webhook) return;

    const delivery: WebhookDelivery = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookId: params.webhookId,
      event: params.event,
      payload: params.payload,
      success: false,
      attempt: params.attempt,
      timestamp: new Date(),
    };

    try {
      const startTime = Date.now();

      // In real implementation, use fetch/axios to send webhook
      // For now, simulate success
      const success = Math.random() > 0.1; // 90% success rate

      delivery.responseTime = Date.now() - startTime;
      delivery.statusCode = success ? 200 : 500;
      delivery.success = success;

      if (success) {
        webhook.lastTriggered = new Date();
        webhook.failureCount = 0;
      } else {
        webhook.failureCount++;

        // Retry if not exceeded max retries
        if (params.attempt < webhook.maxRetries) {
          setTimeout(() => {
            this.deliverWebhook({
              ...params,
              attempt: params.attempt + 1,
            });
          }, 1000 * Math.pow(2, params.attempt)); // Exponential backoff
        }
      }

      this.webhooks.set(webhook.id, webhook);
    } catch (error: any) {
      delivery.error = error.message;
      delivery.success = false;
      webhook.failureCount++;
      this.webhooks.set(webhook.id, webhook);
    }

    this.deliveries.push(delivery);

    // Keep only last 1000 deliveries
    if (this.deliveries.length > 1000) {
      this.deliveries = this.deliveries.slice(-1000);
    }
  }

  /**
   * Get webhook deliveries
   */
  static getWebhookDeliveries(webhookId: string, limit: number = 50): WebhookDelivery[] {
    return this.deliveries
      .filter(d => d.webhookId === webhookId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get API usage statistics
   */
  static getUsageStats(userId: number, days: number = 30) {
    const userKeys = this.getUserAPIKeys(userId);
    const keyIds = userKeys.map(k => k.id);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentRequests = this.requests.filter(
      r => keyIds.includes(r.apiKeyId) && r.timestamp >= cutoff
    );

    const byEndpoint: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const req of recentRequests) {
      byEndpoint[req.endpoint] = (byEndpoint[req.endpoint] || 0) + 1;
      byMethod[req.method] = (byMethod[req.method] || 0) + 1;
      const statusGroup = `${Math.floor(req.statusCode / 100)}xx`;
      byStatus[statusGroup] = (byStatus[statusGroup] || 0) + 1;
    }

    return {
      totalRequests: recentRequests.length,
      avgResponseTime:
        recentRequests.reduce((sum, r) => sum + r.responseTime, 0) /
          recentRequests.length || 0,
      byEndpoint,
      byMethod,
      byStatus,
      activeKeys: userKeys.filter(k => k.isActive).length,
      totalKeys: userKeys.length,
    };
  }

  /**
   * Get available permissions
   */
  static getAvailablePermissions(): string[] {
    return [
      'cases:read',
      'cases:write',
      'cases:delete',
      'contacts:read',
      'contacts:write',
      'contacts:delete',
      'companies:read',
      'companies:write',
      'deals:read',
      'deals:write',
      'orders:read',
      'webhooks:manage',
      'api_keys:manage',
    ];
  }

  /**
   * Get available webhook events
   */
  static getAvailableEvents(): string[] {
    return [
      'case.created',
      'case.updated',
      'case.deleted',
      'case.status_changed',
      'case.assigned',
      'contact.created',
      'contact.updated',
      'company.created',
      'deal.created',
      'deal.stage_changed',
    ];
  }
}
