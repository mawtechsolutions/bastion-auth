/**
 * Internal event types for the event bus
 * These are used for triggering webhooks and audit logs
 */
export const INTERNAL_EVENTS = {
  // User events
  USER_CREATED: 'internal.user.created',
  USER_UPDATED: 'internal.user.updated',
  USER_DELETED: 'internal.user.deleted',

  // Authentication events
  USER_SIGNED_UP: 'internal.auth.signed_up',
  USER_SIGNED_IN: 'internal.auth.signed_in',
  USER_SIGNED_OUT: 'internal.auth.signed_out',
  USER_SIGNED_OUT_ALL: 'internal.auth.signed_out_all',

  // Session events
  SESSION_CREATED: 'internal.session.created',
  SESSION_REFRESHED: 'internal.session.refreshed',
  SESSION_REVOKED: 'internal.session.revoked',

  // Password events
  PASSWORD_RESET_REQUESTED: 'internal.password.reset_requested',
  PASSWORD_RESET: 'internal.password.reset',
  PASSWORD_CHANGED: 'internal.password.changed',

  // Email events
  EMAIL_VERIFICATION_SENT: 'internal.email.verification_sent',
  EMAIL_VERIFIED: 'internal.email.verified',

  // Magic link events
  MAGIC_LINK_SENT: 'internal.magic_link.sent',
  MAGIC_LINK_USED: 'internal.magic_link.used',

  // MFA events
  MFA_SETUP_STARTED: 'internal.mfa.setup_started',
  MFA_ENABLED: 'internal.mfa.enabled',
  MFA_DISABLED: 'internal.mfa.disabled',
  MFA_CHALLENGE_CREATED: 'internal.mfa.challenge_created',
  MFA_CHALLENGE_VERIFIED: 'internal.mfa.challenge_verified',
  MFA_CHALLENGE_FAILED: 'internal.mfa.challenge_failed',
  MFA_BACKUP_CODES_REGENERATED: 'internal.mfa.backup_codes_regenerated',

  // Passkey events
  PASSKEY_REGISTERED: 'internal.passkey.registered',
  PASSKEY_AUTHENTICATED: 'internal.passkey.authenticated',
  PASSKEY_REMOVED: 'internal.passkey.removed',

  // OAuth events
  OAUTH_INITIATED: 'internal.oauth.initiated',
  OAUTH_CALLBACK: 'internal.oauth.callback',
  OAUTH_CONNECTED: 'internal.oauth.connected',
  OAUTH_DISCONNECTED: 'internal.oauth.disconnected',

  // Organization events
  ORGANIZATION_CREATED: 'internal.organization.created',
  ORGANIZATION_UPDATED: 'internal.organization.updated',
  ORGANIZATION_DELETED: 'internal.organization.deleted',

  // Membership events
  MEMBER_INVITED: 'internal.organization.member_invited',
  MEMBER_JOINED: 'internal.organization.member_joined',
  MEMBER_UPDATED: 'internal.organization.member_updated',
  MEMBER_REMOVED: 'internal.organization.member_removed',

  // Invitation events
  INVITATION_CREATED: 'internal.invitation.created',
  INVITATION_ACCEPTED: 'internal.invitation.accepted',
  INVITATION_REVOKED: 'internal.invitation.revoked',
  INVITATION_EXPIRED: 'internal.invitation.expired',

  // Role events
  ROLE_CREATED: 'internal.role.created',
  ROLE_UPDATED: 'internal.role.updated',
  ROLE_DELETED: 'internal.role.deleted',

  // Webhook events
  WEBHOOK_CREATED: 'internal.webhook.created',
  WEBHOOK_UPDATED: 'internal.webhook.updated',
  WEBHOOK_DELETED: 'internal.webhook.deleted',
  WEBHOOK_DELIVERY_ATTEMPTED: 'internal.webhook.delivery_attempted',
  WEBHOOK_DELIVERY_SUCCEEDED: 'internal.webhook.delivery_succeeded',
  WEBHOOK_DELIVERY_FAILED: 'internal.webhook.delivery_failed',

  // API Key events
  API_KEY_CREATED: 'internal.api_key.created',
  API_KEY_USED: 'internal.api_key.used',
  API_KEY_REVOKED: 'internal.api_key.revoked',

  // Security events
  RATE_LIMIT_EXCEEDED: 'internal.security.rate_limit_exceeded',
  ACCOUNT_LOCKED: 'internal.security.account_locked',
  ACCOUNT_UNLOCKED: 'internal.security.account_unlocked',
  SUSPICIOUS_ACTIVITY: 'internal.security.suspicious_activity',
} as const;

export type InternalEvent = (typeof INTERNAL_EVENTS)[keyof typeof INTERNAL_EVENTS];

/**
 * Event payloads for typed event handling
 */
export interface InternalEventPayloads {
  [INTERNAL_EVENTS.USER_CREATED]: { userId: string };
  [INTERNAL_EVENTS.USER_UPDATED]: { userId: string; changes: string[] };
  [INTERNAL_EVENTS.USER_DELETED]: { userId: string };
  [INTERNAL_EVENTS.USER_SIGNED_IN]: { userId: string; sessionId: string; method: string };
  [INTERNAL_EVENTS.USER_SIGNED_OUT]: { userId: string; sessionId: string };
  [INTERNAL_EVENTS.SESSION_CREATED]: { sessionId: string; userId: string };
  [INTERNAL_EVENTS.SESSION_REVOKED]: { sessionId: string; userId: string };
  [INTERNAL_EVENTS.EMAIL_VERIFIED]: { userId: string };
  [INTERNAL_EVENTS.MFA_ENABLED]: { userId: string };
  [INTERNAL_EVENTS.MFA_DISABLED]: { userId: string };
  [INTERNAL_EVENTS.ORGANIZATION_CREATED]: { organizationId: string; creatorId: string };
  [INTERNAL_EVENTS.MEMBER_JOINED]: { organizationId: string; userId: string; role: string };
  [INTERNAL_EVENTS.MEMBER_REMOVED]: { organizationId: string; userId: string };
  // Add more as needed...
}

