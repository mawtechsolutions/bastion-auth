import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import crypto from 'crypto';

import { WEBHOOK_CONFIG, WEBHOOK_EVENTS } from '@bastionauth/core';
import type { CreateWebhookInput, UpdateWebhookInput, WebhookEventType, WebhookPayload } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';

export class WebhookService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Create a new webhook
   */
  async create(data: CreateWebhookInput) {
    const secret = crypto.randomBytes(32).toString('hex');

    return this.prisma.webhook.create({
      data: {
        url: data.url,
        secret,
        events: data.events,
        enabled: data.enabled ?? true,
        organizationId: data.organizationId || null,
      },
    });
  }

  /**
   * Get webhook by ID
   */
  async getById(webhookId: string) {
    return this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });
  }

  /**
   * List webhooks
   */
  async list(organizationId?: string) {
    return this.prisma.webhook.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update webhook
   */
  async update(webhookId: string, data: UpdateWebhookInput) {
    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url: data.url,
        events: data.events,
        enabled: data.enabled,
      },
    });
  }

  /**
   * Delete webhook
   */
  async delete(webhookId: string) {
    await this.prisma.webhook.delete({
      where: { id: webhookId },
    });
  }

  /**
   * Trigger a webhook event
   */
  async trigger<T>(eventType: WebhookEventType, data: T) {
    // Find all enabled webhooks subscribed to this event
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        enabled: true,
        events: { has: eventType },
      },
    });

    // Create delivery records and queue jobs
    for (const webhook of webhooks) {
      const payload: WebhookPayload<T> = {
        id: crypto.randomUUID(),
        type: eventType,
        timestamp: new Date().toISOString(),
        data,
      };

      // Create delivery record
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: payload as unknown as Record<string, unknown>,
          maxAttempts: WEBHOOK_CONFIG.MAX_DELIVERY_ATTEMPTS,
        },
      });

      // Queue the delivery job
      await this.queueDelivery(delivery.id);
    }
  }

  /**
   * Queue a webhook delivery
   */
  private async queueDelivery(deliveryId: string) {
    // Add to Redis queue for processing
    await this.redis.rpush('webhook:deliveries', deliveryId);
  }

  /**
   * Process a webhook delivery (called by worker)
   */
  async processDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery || !delivery.webhook) {
      return;
    }

    const { webhook, payload } = delivery;

    try {
      // Create signature
      const signature = this.createSignature(
        JSON.stringify(payload),
        webhook.secret
      );

      // Make request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': delivery.id,
          'X-Webhook-Event': delivery.eventType,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_CONFIG.REQUEST_TIMEOUT_SECONDS * 1000),
      });

      const responseBody = await response.text().catch(() => '');

      // Update delivery record
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          statusCode: response.status,
          responseBody: responseBody.substring(0, 1000),
          attempts: delivery.attempts + 1,
          deliveredAt: response.ok ? new Date() : null,
          error: response.ok ? null : `HTTP ${response.status}`,
        },
      });

      if (!response.ok) {
        await this.scheduleRetry(delivery);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: delivery.attempts + 1,
          error: errorMessage,
        },
      });

      await this.scheduleRetry(delivery);
    }
  }

  /**
   * Schedule a retry for failed delivery
   */
  private async scheduleRetry(delivery: {
    id: string;
    attempts: number;
    maxAttempts: number;
  }) {
    if (delivery.attempts >= delivery.maxAttempts) {
      return; // No more retries
    }

    // Calculate backoff delay
    const delay =
      WEBHOOK_CONFIG.INITIAL_RETRY_DELAY_SECONDS *
      Math.pow(WEBHOOK_CONFIG.RETRY_BACKOFF_MULTIPLIER, delivery.attempts);

    const nextRetryAt = new Date(Date.now() + delay * 1000);

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: { nextRetryAt },
    });

    // Schedule in Redis
    await this.redis.zadd(
      'webhook:retry',
      nextRetryAt.getTime().toString(),
      delivery.id
    );
  }

  /**
   * Create HMAC signature for webhook payload
   */
  private createSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Verify webhook signature (for use by clients)
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
    tolerance = 300 // 5 minutes
  ): boolean {
    const match = signature.match(/t=(\d+),v1=([a-f0-9]+)/);
    if (!match) return false;

    const [, timestamp, providedSignature] = match;
    const now = Math.floor(Date.now() / 1000);

    // Check timestamp tolerance
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(webhookId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Retry a failed delivery
   */
  async retryDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw Errors.webhookNotFound();
    }

    // Reset attempts and queue for processing
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: 0,
        error: null,
        nextRetryAt: null,
      },
    });

    await this.queueDelivery(deliveryId);
  }
}

