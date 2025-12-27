import crypto from 'crypto';

import { hash, verify } from '@node-rs/argon2';

import { ARGON2_CONFIG } from '@bastionauth/core';

import { env } from '../config/env.js';

// ============================================
// PASSWORD HASHING (Argon2id)
// ============================================

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: ARGON2_CONFIG.MEMORY_COST,
    timeCost: ARGON2_CONFIG.TIME_COST,
    parallelism: ARGON2_CONFIG.PARALLELISM,
    outputLen: ARGON2_CONFIG.HASH_LENGTH,
  });
}

/**
 * Verify a password against an Argon2id hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await verify(hashedPassword, password, {
      memoryCost: ARGON2_CONFIG.MEMORY_COST,
      timeCost: ARGON2_CONFIG.TIME_COST,
      parallelism: ARGON2_CONFIG.PARALLELISM,
      outputLen: ARGON2_CONFIG.HASH_LENGTH,
    });
  } catch {
    return false;
  }
}

// ============================================
// SYMMETRIC ENCRYPTION (AES-256-GCM)
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const _AUTH_TAG_LENGTH = 16; // Reserved for future use

/**
 * Get the encryption key from environment
 */
function getEncryptionKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns format: iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid ciphertext format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================
// HASHING (SHA-256)
// ============================================

/**
 * Hash a string using SHA-256
 */
export function hashSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Create an HMAC signature
 */
export function createHmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify an HMAC signature (timing-safe)
 */
export function verifyHmac(data: string, signature: string, secret: string): boolean {
  const expected = createHmac(data, secret);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

// ============================================
// RANDOM TOKEN GENERATION
// ============================================

/**
 * Generate a random token (URL-safe base64)
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate a random hex string
 */
export function generateHex(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a numeric OTP code
 */
export function generateOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  const code = crypto.randomInt(0, max);
  return code.toString().padStart(digits, '0');
}

/**
 * Generate backup codes (8-character alphanumeric)
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

// ============================================
// TIMING-SAFE COMPARISON
// ============================================

/**
 * Compare two strings in constant time
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

