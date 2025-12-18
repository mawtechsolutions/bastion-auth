/**
 * Session status enum
 */
export type SessionStatus = 'active' | 'revoked' | 'expired';

/**
 * Session entity
 */
export interface Session {
  id: string;
  userId: string;
  status: SessionStatus;
  deviceFingerprint: string | null;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  city: string | null;
  expiresAt: Date;
  lastActiveAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/**
 * Session with current flag
 */
export interface SessionWithCurrent extends Session {
  isCurrent: boolean;
}

/**
 * Session creation data (internal)
 */
export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  country?: string;
  city?: string;
  expiresAt: Date;
}

/**
 * JWT access token payload
 */
export interface AccessTokenPayload {
  /** Subject - user ID */
  sub: string;
  /** User email */
  email: string;
  /** Session ID */
  sessionId: string;
  /** Organization ID (if switched to an org) */
  orgId?: string;
  /** Role in the organization */
  orgRole?: string;
  /** Issued at (Unix timestamp) */
  iat: number;
  /** Expiration (Unix timestamp) */
  exp: number;
  /** Issuer */
  iss: string;
  /** Audience */
  aud: string;
}

/**
 * Token pair returned on authentication
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

