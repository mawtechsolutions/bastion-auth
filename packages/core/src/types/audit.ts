import type { JsonValue } from './api.js';

/**
 * Actor type for audit logs
 */
export type ActorType = 'user' | 'admin' | 'system' | 'api_key';

/**
 * Audit log status
 */
export type AuditStatus = 'success' | 'failure' | 'blocked';

/**
 * Audit log actions
 */
export const AUDIT_ACTIONS = {
  // Authentication
  SIGN_UP: 'user.sign_up',
  SIGN_IN: 'user.sign_in',
  SIGN_IN_MFA: 'user.sign_in_mfa',
  SIGN_IN_OAUTH: 'user.sign_in_oauth',
  SIGN_IN_MAGIC_LINK: 'user.sign_in_magic_link',
  SIGN_IN_PASSKEY: 'user.sign_in_passkey',
  SIGN_OUT: 'user.sign_out',
  SIGN_OUT_ALL: 'user.sign_out_all',

  // Password
  PASSWORD_RESET_REQUESTED: 'password.reset_requested',
  PASSWORD_RESET: 'password.reset',
  PASSWORD_CHANGED: 'password.changed',

  // Email
  EMAIL_VERIFICATION_SENT: 'email.verification_sent',
  EMAIL_VERIFIED: 'email.verified',

  // MFA
  MFA_ENABLED: 'mfa.enabled',
  MFA_DISABLED: 'mfa.disabled',
  MFA_BACKUP_CODES_REGENERATED: 'mfa.backup_codes_regenerated',
  MFA_CHALLENGE_FAILED: 'mfa.challenge_failed',

  // Passkeys
  PASSKEY_REGISTERED: 'passkey.registered',
  PASSKEY_REMOVED: 'passkey.removed',

  // User
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // OAuth
  OAUTH_CONNECTED: 'oauth.connected',
  OAUTH_DISCONNECTED: 'oauth.disconnected',

  // Sessions
  SESSION_REVOKED: 'session.revoked',

  // Organizations
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',

  // Memberships
  MEMBER_INVITED: 'organization.member_invited',
  MEMBER_JOINED: 'organization.member_joined',
  MEMBER_UPDATED: 'organization.member_updated',
  MEMBER_REMOVED: 'organization.member_removed',
  INVITATION_REVOKED: 'organization.invitation_revoked',

  // Roles
  ROLE_CREATED: 'organization.role_created',
  ROLE_UPDATED: 'organization.role_updated',
  ROLE_DELETED: 'organization.role_deleted',

  // Admin actions
  ADMIN_USER_UPDATED: 'admin.user_updated',
  ADMIN_USER_BANNED: 'admin.user_banned',
  ADMIN_USER_UNBANNED: 'admin.user_unbanned',
  ADMIN_USER_DELETED: 'admin.user_deleted',
  ADMIN_USER_IMPERSONATED: 'admin.user_impersonated',
  ADMIN_SESSION_REVOKED: 'admin.session_revoked',

  // Webhooks
  WEBHOOK_CREATED: 'webhook.created',
  WEBHOOK_UPDATED: 'webhook.updated',
  WEBHOOK_DELETED: 'webhook.deleted',

  // API Keys
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',

  // Security
  RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  ACCOUNT_LOCKED: 'security.account_locked',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  actorType: ActorType;
  action: AuditAction | string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  city: string | null;
  metadata: JsonValue;
  status: AuditStatus;
  createdAt: Date;
}

/**
 * Audit log creation input
 */
export interface CreateAuditLogInput {
  userId?: string | null;
  actorType?: ActorType;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;
  metadata?: JsonValue;
  status?: AuditStatus;
}

/**
 * Audit log with user info
 */
export interface AuditLogWithUser extends AuditLog {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

/**
 * Audit log query filters
 */
export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction | string;
  entityType?: string;
  entityId?: string;
  actorType?: ActorType;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
}

