import type { PrismaClient } from '@prisma/client';

import type { UpdateUserInput, User } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { isPasswordBreached } from '../utils/hibp.js';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) return null;
    return this.sanitizeUser(user);
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user) return null;
    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async update(userId: string, data: UpdateUserInput): Promise<User> {
    // Check username uniqueness if changing
    if (data.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: data.username.toLowerCase(),
          id: { not: userId },
        },
        select: { id: true },
      });

      if (existing) {
        throw Errors.usernameAlreadyExists();
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username?.toLowerCase(),
        imageUrl: data.imageUrl || null,
        unsafeMetadata: data.unsafeMetadata,
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw Errors.invalidPassword();
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw Errors.invalidPassword();
    }

    // Check if new password is the same
    const samePassword = await verifyPassword(newPassword, user.passwordHash);
    if (samePassword) {
      throw Errors.samePassword();
    }

    // Check password breach
    const isBreached = await isPasswordBreached(newPassword);
    if (isBreached) {
      throw Errors.passwordBreached();
    }

    // Hash and update
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  /**
   * Delete user (soft delete)
   */
  async delete(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${userId}@deleted.bastionauth.dev`,
        username: null,
      },
    });

    // Revoke all sessions
    await this.prisma.session.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Get user's active sessions
   */
  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        country: true,
        city: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw Errors.sessionNotFound();
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Get user's OAuth accounts
   */
  async getOAuthAccounts(userId: string) {
    return this.prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  /**
   * Remove OAuth account
   */
  async removeOAuthAccount(userId: string, accountId: string): Promise<void> {
    // Check if this is the only auth method
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        _count: {
          select: { oauthAccounts: true, passkeys: true },
        },
      },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    const hasPassword = !!user.passwordHash;
    const hasOtherOAuth = user._count.oauthAccounts > 1;
    const hasPasskeys = user._count.passkeys > 0;

    if (!hasPassword && !hasOtherOAuth && !hasPasskeys) {
      throw Errors.invalidInput(
        'Cannot remove last authentication method. Add a password or another OAuth account first.'
      );
    }

    await this.prisma.oAuthAccount.deleteMany({
      where: { id: accountId, userId },
    });
  }

  /**
   * Get user's passkeys
   */
  async getPasskeys(userId: string) {
    return this.prisma.passkey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  /**
   * Remove passkey
   */
  async removePasskey(userId: string, passkeyId: string): Promise<void> {
    await this.prisma.passkey.deleteMany({
      where: { id: passkeyId, userId },
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

