/**
 * Token configuration
 */
export const TOKEN_CONFIG = {
  /** Access token expiry in seconds (15 minutes) */
  ACCESS_TOKEN_EXPIRY_SECONDS: 15 * 60,
  /** Refresh token expiry in seconds (7 days) */
  REFRESH_TOKEN_EXPIRY_SECONDS: 7 * 24 * 60 * 60,
  /** Refresh token prefix */
  REFRESH_TOKEN_PREFIX: 'rt_',
  /** JWT issuer */
  JWT_ISSUER: 'bastionauth',
  /** JWT audience */
  JWT_AUDIENCE: 'bastionauth',
  /** JWT algorithm */
  JWT_ALGORITHM: 'RS256' as const,
} as const;

/**
 * Password configuration
 */
export const PASSWORD_CONFIG = {
  /** Minimum password length */
  MIN_LENGTH: 8,
  /** Maximum password length */
  MAX_LENGTH: 128,
  /** Require uppercase letter */
  REQUIRE_UPPERCASE: true,
  /** Require lowercase letter */
  REQUIRE_LOWERCASE: true,
  /** Require number */
  REQUIRE_NUMBER: true,
  /** Require special character */
  REQUIRE_SPECIAL: false,
  /** Maximum failed login attempts before lockout */
  MAX_FAILED_ATTEMPTS: 5,
  /** Account lockout duration in seconds (15 minutes) */
  LOCKOUT_DURATION_SECONDS: 15 * 60,
} as const;

/**
 * MFA configuration
 */
export const MFA_CONFIG = {
  /** TOTP issuer name */
  TOTP_ISSUER: 'BastionAuth',
  /** TOTP time step in seconds */
  TOTP_STEP: 30,
  /** TOTP digits */
  TOTP_DIGITS: 6,
  /** Number of backup codes to generate */
  BACKUP_CODES_COUNT: 10,
  /** MFA challenge expiry in seconds (5 minutes) */
  CHALLENGE_EXPIRY_SECONDS: 5 * 60,
  /** Maximum MFA verification attempts */
  MAX_VERIFICATION_ATTEMPTS: 3,
} as const;

/**
 * Email verification configuration
 */
export const EMAIL_CONFIG = {
  /** Verification token expiry in seconds (24 hours) */
  VERIFICATION_TOKEN_EXPIRY_SECONDS: 24 * 60 * 60,
  /** Password reset token expiry in seconds (1 hour) */
  PASSWORD_RESET_TOKEN_EXPIRY_SECONDS: 60 * 60,
  /** Magic link expiry in seconds (15 minutes) */
  MAGIC_LINK_EXPIRY_SECONDS: 15 * 60,
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  /** Default session expiry in seconds (7 days) */
  DEFAULT_EXPIRY_SECONDS: 7 * 24 * 60 * 60,
  /** Session activity timeout in seconds (30 minutes of inactivity) */
  ACTIVITY_TIMEOUT_SECONDS: 30 * 60,
  /** Maximum sessions per user */
  MAX_SESSIONS_PER_USER: 10,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  /** Sign-in rate limit (per 15 minutes) */
  SIGN_IN: { window: 15 * 60, max: 5 },
  /** Sign-up rate limit (per hour) */
  SIGN_UP: { window: 60 * 60, max: 10 },
  /** Magic link rate limit (per hour) */
  MAGIC_LINK: { window: 60 * 60, max: 3 },
  /** Password reset rate limit (per hour) */
  PASSWORD_RESET: { window: 60 * 60, max: 3 },
  /** Email verification rate limit (per hour) */
  EMAIL_VERIFICATION: { window: 60 * 60, max: 5 },
  /** API rate limit for authenticated users (per minute) */
  API_AUTHENTICATED: { window: 60, max: 100 },
  /** API rate limit for unauthenticated requests (per minute) */
  API_UNAUTHENTICATED: { window: 60, max: 20 },
} as const;

/**
 * Organization configuration
 */
export const ORGANIZATION_CONFIG = {
  /** Invitation expiry in seconds (7 days) */
  INVITATION_EXPIRY_SECONDS: 7 * 24 * 60 * 60,
  /** Default member role */
  DEFAULT_ROLE: 'member',
  /** Maximum organization name length */
  MAX_NAME_LENGTH: 100,
  /** Maximum organization slug length */
  MAX_SLUG_LENGTH: 50,
} as const;

/**
 * Webhook configuration
 */
export const WEBHOOK_CONFIG = {
  /** Maximum delivery attempts */
  MAX_DELIVERY_ATTEMPTS: 3,
  /** Initial retry delay in seconds */
  INITIAL_RETRY_DELAY_SECONDS: 60,
  /** Backoff multiplier for retries */
  RETRY_BACKOFF_MULTIPLIER: 2,
  /** Request timeout in seconds */
  REQUEST_TIMEOUT_SECONDS: 30,
  /** Maximum payload size in bytes */
  MAX_PAYLOAD_SIZE_BYTES: 256 * 1024, // 256KB
} as const;

/**
 * API Key configuration
 */
export const API_KEY_CONFIG = {
  /** Live key prefix */
  LIVE_PREFIX: 'ba_live_',
  /** Test key prefix */
  TEST_PREFIX: 'ba_test_',
  /** Key length (excluding prefix) */
  KEY_LENGTH: 32,
} as const;

/**
 * Argon2 configuration for password hashing
 */
export const ARGON2_CONFIG = {
  /** Memory cost in KB (64 MB) */
  MEMORY_COST: 65536,
  /** Time cost (iterations) */
  TIME_COST: 3,
  /** Parallelism */
  PARALLELISM: 4,
  /** Hash length in bytes */
  HASH_LENGTH: 32,
} as const;

