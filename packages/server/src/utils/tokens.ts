import crypto from 'crypto';

import type { KeyLike } from 'jose';
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';

import { TOKEN_CONFIG } from '@bastionauth/core';
import type { AccessTokenPayload } from '@bastionauth/core';

import { env } from '../config/env.js';

// ============================================
// JWT (RS256)
// ============================================

let privateKey: KeyLike | null = null;
let publicKey: KeyLike | null = null;

/**
 * Get the private key for signing JWTs
 */
async function getPrivateKey(): Promise<KeyLike> {
  if (!privateKey) {
    privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, TOKEN_CONFIG.JWT_ALGORITHM);
  }
  return privateKey;
}

/**
 * Get the public key for verifying JWTs
 */
async function getPublicKey(): Promise<KeyLike> {
  if (!publicKey) {
    publicKey = await importSPKI(env.JWT_PUBLIC_KEY, TOKEN_CONFIG.JWT_ALGORITHM);
  }
  return publicKey;
}

/**
 * Generate an access token (JWT)
 */
export async function generateAccessToken(payload: {
  userId: string;
  email: string;
  sessionId: string;
  orgId?: string;
  orgRole?: string;
}): Promise<string> {
  const key = await getPrivateKey();

  return new SignJWT({
    email: payload.email,
    sessionId: payload.sessionId,
    orgId: payload.orgId,
    orgRole: payload.orgRole,
  })
    .setProtectedHeader({ alg: TOKEN_CONFIG.JWT_ALGORITHM, typ: 'JWT' })
    .setSubject(payload.userId)
    .setIssuer(TOKEN_CONFIG.JWT_ISSUER)
    .setAudience(TOKEN_CONFIG.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS}s`)
    .sign(key);
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const key = await getPublicKey();

  const { payload } = await jwtVerify(token, key, {
    issuer: TOKEN_CONFIG.JWT_ISSUER,
    audience: TOKEN_CONFIG.JWT_AUDIENCE,
  });

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    sessionId: payload.sessionId as string,
    orgId: payload.orgId as string | undefined,
    orgRole: payload.orgRole as string | undefined,
    iat: payload.iat as number,
    exp: payload.exp as number,
    iss: payload.iss as string,
    aud: payload.aud as string,
  };
}

// ============================================
// REFRESH TOKENS (Opaque)
// ============================================

/**
 * Generate a refresh token
 * Format: rt_{64 random hex characters}
 */
export function generateRefreshToken(): string {
  const randomBytes = crypto.randomBytes(32);
  return `${TOKEN_CONFIG.REFRESH_TOKEN_PREFIX}${randomBytes.toString('hex')}`;
}

/**
 * Hash a refresh token for storage
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate refresh token format
 */
export function isValidRefreshTokenFormat(token: string): boolean {
  return token.startsWith(TOKEN_CONFIG.REFRESH_TOKEN_PREFIX) && token.length === 67; // rt_ + 64 chars
}

// ============================================
// VERIFICATION TOKENS
// ============================================

/**
 * Generate a verification token (URL-safe)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a magic link token
 */
export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a password reset token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate an invitation token
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

