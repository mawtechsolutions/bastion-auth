import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';

import {
  AUDIT_ACTIONS,
  EMAIL_CONFIG,
  MFA_CONFIG,
  PASSWORD_CONFIG,
  SESSION_CONFIG,
  TOKEN_CONFIG,
} from '@bastionauth/core';
import type {
  MfaMethod,
  SignInRequest,
  SignUpRequest,
  TokenPair,
  User,
} from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import {
  decrypt,
  encrypt,
  hashPassword,
  hashSha256,
  verifyPassword,
} from '../utils/crypto.js';
import { isPasswordBreached } from '../utils/hibp.js';
import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  generateVerificationToken,
  hashRefreshToken,
} from '../utils/tokens.js';

interface RequestContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  country?: string;
  city?: string;
}

interface AuthResult {
  user: User;
  tokens: TokenPair;
  session: {
    id: string;
    expiresAt: Date;
  };
}

interface MfaRequiredResult {
  requiresMfa: true;
  mfaChallengeId: string;
  supportedMethods: MfaMethod[];
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Register a new user
   */
  async signUp(data: SignUpRequest, context: RequestContext): Promise<AuthResult> {
    const email = data.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw Errors.emailAlreadyExists();
    }

    // Check username uniqueness if provided
    if (data.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
        select: { id: true },
      });
      if (usernameExists) {
        throw Errors.usernameAlreadyExists();
      }
    }

    // Check password strength
    if (data.password.length < PASSWORD_CONFIG.MIN_LENGTH) {
      throw Errors.passwordTooWeak(['Minimum 8 characters']);
    }

    // Check if password is breached
    const isBreached = await isPasswordBreached(data.password);
    if (isBreached) {
      throw Errors.passwordBreached();
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: data.firstName?.trim() || null,
        lastName: data.lastName?.trim() || null,
        username: data.username?.toLowerCase().trim() || null,
        passwordChangedAt: new Date(),
      },
    });

    // Create session
    const { tokens, session } = await this.createSession(user.id, context);

    // Update last sign in
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignInAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      session,
    };
  }

  /**
   * Sign in with email and password
   */
  async signIn(
    data: SignInRequest,
    context: RequestContext
  ): Promise<AuthResult | MfaRequiredResult> {
    const email = data.email.toLowerCase().trim();

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw Errors.invalidCredentials();
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw Errors.userLocked(user.lockedUntil);
    }

    // Check if account is deleted
    if (user.deletedAt) {
      throw Errors.userDeleted();
    }

    // Verify password
    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      // Increment failed attempts
      await this.handleFailedLogin(user.id);
      throw Errors.invalidCredentials();
    }

    // Clear failed attempts on success
    await this.clearFailedAttempts(user.id);

    // Check if MFA is required
    if (user.mfaEnabled && user.mfaSecret) {
      const challengeId = await this.createMfaChallenge(user.id);
      return {
        requiresMfa: true,
        mfaChallengeId: challengeId,
        supportedMethods: ['totp', 'backup_code'],
      };
    }

    // Create session
    const { tokens, session } = await this.createSession(user.id, context);

    // Update last sign in
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignInAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      session,
    };
  }

  /**
   * Verify MFA code and complete sign in
   */
  async verifyMfa(
    challengeId: string,
    code: string,
    method: MfaMethod,
    context: RequestContext
  ): Promise<AuthResult> {
    // Get challenge from Redis
    const challengeData = await this.redis.get(`mfa:challenge:${challengeId}`);
    if (!challengeData) {
      throw Errors.invalidToken('MFA challenge expired or invalid');
    }

    const { userId, attempts } = JSON.parse(challengeData);

    // Check attempts
    if (attempts >= MFA_CONFIG.MAX_VERIFICATION_ATTEMPTS) {
      await this.redis.del(`mfa:challenge:${challengeId}`);
      throw Errors.tooManyFailedAttempts();
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw Errors.mfaNotEnabled();
    }

    let valid = false;

    if (method === 'totp') {
      // Verify TOTP
      valid = await this.verifyTotp(user.mfaSecret, code);
    } else if (method === 'backup_code') {
      // Verify backup code
      valid = await this.verifyBackupCode(user.id, user.mfaBackupCodes, code);
    }

    if (!valid) {
      // Increment attempts
      await this.redis.set(
        `mfa:challenge:${challengeId}`,
        JSON.stringify({ userId, attempts: attempts + 1 }),
        'EX',
        MFA_CONFIG.CHALLENGE_EXPIRY_SECONDS
      );
      throw Errors.mfaInvalidCode();
    }

    // Delete challenge
    await this.redis.del(`mfa:challenge:${challengeId}`);

    // Create session
    const { tokens, session } = await this.createSession(user.id, context);

    // Update last sign in
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignInAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      session,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    context: RequestContext
  ): Promise<TokenPair> {
    // Hash the refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // Find session
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!session) {
      throw Errors.sessionNotFound();
    }

    if (session.status !== 'ACTIVE') {
      throw Errors.sessionRevoked();
    }

    if (session.expiresAt < new Date()) {
      // Mark session as expired
      await this.prisma.session.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      throw Errors.tokenExpired();
    }

    if (session.user.deletedAt) {
      throw Errors.userDeleted();
    }

    // Generate new tokens (token rotation)
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    const accessToken = await generateAccessToken({
      userId: session.userId,
      email: session.user.email,
      sessionId: session.id,
    });

    // Update session with new token hash
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastActiveAt: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Sign out (revoke session)
   */
  async signOut(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Sign out all sessions for a user
   */
  async signOutAll(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { token: '' };
    }

    // Generate reset token
    const token = generatePasswordResetToken();
    const tokenHash = hashSha256(token);

    // Store token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_CONFIG.PASSWORD_RESET_TOKEN_EXPIRY_SECONDS * 1000),
      },
    });

    return { token };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashSha256(token);

    // Find token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw Errors.invalidToken('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw Errors.invalidToken('Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw Errors.invalidToken('Reset token has expired');
    }

    // Check password strength and breaches
    if (newPassword.length < PASSWORD_CONFIG.MIN_LENGTH) {
      throw Errors.passwordTooWeak(['Minimum 8 characters']);
    }

    const isBreached = await isPasswordBreached(newPassword);
    if (isBreached) {
      throw Errors.passwordBreached();
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all active sessions
      this.prisma.session.updateMany({
        where: {
          userId: resetToken.userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      }),
    ]);
  }

  /**
   * Request email verification
   */
  async requestEmailVerification(userId: string): Promise<{ token: string }> {
    const token = generateVerificationToken();

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + EMAIL_CONFIG.VERIFICATION_TOKEN_EXPIRY_SECONDS * 1000),
      },
    });

    return { token };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw Errors.invalidToken('Invalid verification token');
    }

    if (verificationToken.usedAt) {
      throw Errors.invalidToken('Verification token has already been used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw Errors.invalidToken('Verification token has expired');
    }

    // Mark email as verified
    const user = await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Mark token as used
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    return this.sanitizeUser(user);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async createSession(
    userId: string,
    context: RequestContext
  ): Promise<{ tokens: TokenPair; session: { id: string; expiresAt: Date } }> {
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.DEFAULT_EXPIRY_SECONDS * 1000);

    // Create session in database
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint,
        country: context.country,
        city: context.city,
        expiresAt,
      },
    });

    // Get user for access token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Generate access token
    const accessToken = await generateAccessToken({
      userId,
      email: user!.email,
      sessionId: session.id,
    });

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS,
      },
      session: {
        id: session.id,
        expiresAt,
      },
    };
  }

  private async createMfaChallenge(userId: string): Promise<string> {
    const challengeId = crypto.randomUUID();

    await this.redis.set(
      `mfa:challenge:${challengeId}`,
      JSON.stringify({ userId, attempts: 0 }),
      'EX',
      MFA_CONFIG.CHALLENGE_EXPIRY_SECONDS
    );

    return challengeId;
  }

  private async verifyTotp(encryptedSecret: string, code: string): Promise<boolean> {
    const { TOTP } = await import('otpauth');

    const secret = decrypt(encryptedSecret);
    const totp = new TOTP({
      issuer: MFA_CONFIG.TOTP_ISSUER,
      label: 'BastionAuth',
      algorithm: 'SHA1',
      digits: MFA_CONFIG.TOTP_DIGITS,
      period: MFA_CONFIG.TOTP_STEP,
      secret,
    });

    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  private async verifyBackupCode(
    userId: string,
    encryptedCodes: string[],
    code: string
  ): Promise<boolean> {
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');

    for (let i = 0; i < encryptedCodes.length; i++) {
      const decryptedCode = decrypt(encryptedCodes[i]);
      if (decryptedCode === normalizedCode) {
        // Remove used backup code
        const newCodes = [...encryptedCodes];
        newCodes.splice(i, 1);

        await this.prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: newCodes },
        });

        return true;
      }
    }

    return false;
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const newAttempts = (user?.failedLoginAttempts || 0) + 1;

    const updateData: {
      failedLoginAttempts: number;
      lastFailedLoginAt: Date;
      lockedUntil?: Date;
    } = {
      failedLoginAttempts: newAttempts,
      lastFailedLoginAt: new Date(),
    };

    // Lock account after max failed attempts
    if (newAttempts >= PASSWORD_CONFIG.MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(
        Date.now() + PASSWORD_CONFIG.LOCKOUT_DURATION_SECONDS * 1000
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private async clearFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
      },
    });
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    emailVerified: boolean;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    imageUrl: string | null;
    mfaEnabled: boolean;
    publicMetadata: unknown;
    unsafeMetadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt: Date | null;
  }): User {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      mfaEnabled: user.mfaEnabled,
      publicMetadata: user.publicMetadata as Record<string, unknown>,
      unsafeMetadata: user.unsafeMetadata as Record<string, unknown>,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignInAt: user.lastSignInAt,
    };
  }
}

