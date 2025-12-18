import type { JsonValue } from './api.js';

/**
 * Base user type representing the core user entity
 */
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  mfaEnabled: boolean;
  publicMetadata: JsonValue;
  unsafeMetadata: JsonValue;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date | null;
}

/**
 * Extended user type with private data (server-only)
 */
export interface UserWithPrivateData extends User {
  passwordHash: string | null;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
  privateMetadata: JsonValue;
  lockedUntil: Date | null;
  failedLoginAttempts: number;
  lastFailedLoginAt: Date | null;
  passwordChangedAt: Date | null;
  deletedAt: Date | null;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  emailVerified?: boolean;
  publicMetadata?: JsonValue;
  privateMetadata?: JsonValue;
  unsafeMetadata?: JsonValue;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  unsafeMetadata?: JsonValue;
}

/**
 * Admin user update input (can update more fields)
 */
export interface AdminUpdateUserInput extends UpdateUserInput {
  emailVerified?: boolean;
  publicMetadata?: JsonValue;
  privateMetadata?: JsonValue;
}

/**
 * OAuth account linked to a user
 */
export interface OAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'apple' | 'linkedin';

/**
 * Passkey/WebAuthn credential
 */
export interface Passkey {
  id: string;
  userId: string;
  credentialId: string;
  name: string;
  deviceType: 'platform' | 'cross-platform';
  backedUp: boolean;
  transports: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * Email verification token
 */
export interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Password reset token
 */
export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Magic link for passwordless authentication
 */
export interface MagicLink {
  id: string;
  userId: string | null;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  redirectUrl: string | null;
  createdAt: Date;
}

