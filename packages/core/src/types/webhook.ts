import type { JsonValue } from './api.js';

/**
 * Webhook event types
 */
export const WEBHOOK_EVENTS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_SIGNED_IN: 'user.signed_in',
  USER_SIGNED_OUT: 'user.signed_out',

  // Session events
  SESSION_CREATED: 'session.created',
  SESSION_REVOKED: 'session.revoked',
  SESSION_EXPIRED: 'session.expired',

  // Email events
  EMAIL_VERIFIED: 'email.verified',
  PASSWORD_RESET: 'password.reset',

  // MFA events
  MFA_ENABLED: 'mfa.enabled',
  MFA_DISABLED: 'mfa.disabled',

  // Organization events
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',

  // Membership events
  MEMBER_ADDED: 'organization.member_added',
  MEMBER_UPDATED: 'organization.member_updated',
  MEMBER_REMOVED: 'organization.member_removed',

  // Invitation events
  INVITATION_CREATED: 'organization.invitation_created',
  INVITATION_ACCEPTED: 'organization.invitation_accepted',
  INVITATION_REVOKED: 'organization.invitation_revoked',
} as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

/**
 * Webhook configuration
 */
export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  enabled: boolean;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook creation input
 */
export interface CreateWebhookInput {
  url: string;
  events: WebhookEventType[];
  enabled?: boolean;
  organizationId?: string;
}

/**
 * Webhook update input
 */
export interface UpdateWebhookInput {
  url?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: JsonValue;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  deliveredAt: Date | null;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = JsonValue> {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: T;
}

/**
 * User webhook data
 */
export interface UserWebhookData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session webhook data
 */
export interface SessionWebhookData {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  city: string | null;
  createdAt: string;
}

/**
 * Organization webhook data
 */
export interface OrganizationWebhookData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Membership webhook data
 */
export interface MembershipWebhookData {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
}

