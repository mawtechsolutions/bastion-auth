import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

import { API_KEY_CONFIG, calculateOffset } from '@bastionauth/core';
import type { ListQueryParams, PaginatedResponse, User } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { hashSha256 } from '../utils/crypto.js';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * List all users with pagination
   */
  async listUsers(
    params: ListQueryParams
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 20, search, sort = 'createdAt', order = 'desc' } = params;
    const offset = calculateOffset(page, limit);

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          emailVerified: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
          mfaEnabled: true,
          publicMetadata: true,
          unsafeMetadata: true,
          createdAt: true,
          updatedAt: true,
          lastSignInAt: true,
          lockedUntil: true,
          deletedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => this.sanitizeUser(u)) as User[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        username: true,
        imageUrl: true,
        mfaEnabled: true,
        publicMetadata: true,
        privateMetadata: true,
        unsafeMetadata: true,
        createdAt: true,
        updatedAt: true,
        lastSignInAt: true,
        lockedUntil: true,
        deletedAt: true,
        // Explicitly exclude passwordHash for security
        sessions: {
          where: { status: 'ACTIVE' },
          orderBy: { lastActiveAt: 'desc' },
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            lastActiveAt: true,
            createdAt: true,
          },
        },
        oauthAccounts: {
          select: {
            id: true,
            provider: true,
            email: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            memberships: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    return user;
  }

  /**
   * Update user (admin)
   */
  async updateUser(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      emailVerified?: boolean;
      publicMetadata?: Record<string, unknown>;
      privateMetadata?: Record<string, unknown>;
    }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        username: true,
        imageUrl: true,
        mfaEnabled: true,
        publicMetadata: true,
        privateMetadata: true,
        unsafeMetadata: true,
        createdAt: true,
        updatedAt: true,
        lastSignInAt: true,
        lockedUntil: true,
        deletedAt: true,
        // Explicitly exclude passwordHash
      },
    });
  }

  /**
   * Ban user
   */
  async banUser(userId: string, duration?: number) {
    const lockedUntil = duration
      ? new Date(Date.now() + duration * 1000)
      : new Date('2099-12-31'); // Permanent ban

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil },
      }),
      // Revoke all active sessions
      this.prisma.session.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date() },
      }),
    ]);
  }

  /**
   * Unban user
   */
  async unbanUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
  }

  /**
   * Delete user (hard delete)
   */
  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Impersonate user (create session for admin)
   */
  async impersonateUser(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    // Create impersonation session
    const { generateRefreshToken, hashRefreshToken, generateAccessToken } = await import(
      '../utils/tokens.js'
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ipAddress: 'impersonation',
        userAgent: `Impersonated by admin ${adminUserId}`,
        expiresAt,
      },
    });

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * List sessions with pagination
   */
  async listSessions(params: ListQueryParams & { userId?: string }) {
    const { page = 1, limit = 20, userId, sort = 'createdAt', order = 'desc' } = params;
    const offset = calculateOffset(page, limit);

    const where = userId ? { userId } : {};

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  // ============================================
  // ORGANIZATION MANAGEMENT
  // ============================================

  /**
   * List organizations
   */
  async listOrganizations(params: ListQueryParams) {
    const { page = 1, limit = 20, search, sort = 'createdAt', order = 'desc' } = params;
    const offset = calculateOffset(page, limit);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { memberships: true },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  /**
   * List audit logs
   */
  async listAuditLogs(
    params: ListQueryParams & {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = params;
    const offset = calculateOffset(page, limit);

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // API KEYS
  // ============================================

  /**
   * Create API key
   */
  async createApiKey(data: {
    name: string;
    scopes?: string[];
    organizationId?: string;
    expiresAt?: Date;
  }) {
    const keyBytes = crypto.randomBytes(API_KEY_CONFIG.KEY_LENGTH);
    const fullKey = `${API_KEY_CONFIG.LIVE_PREFIX}${keyBytes.toString('hex')}`;
    const keyHash = hashSha256(fullKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        keyPrefix: API_KEY_CONFIG.LIVE_PREFIX,
        scopes: data.scopes || ['*'],
        organizationId: data.organizationId || null,
        expiresAt: data.expiresAt || null,
      },
    });

    // Return the full key only once (it won't be stored)
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey, // This is the only time the full key is available
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }

  /**
   * List API keys
   */
  async listApiKeys(organizationId?: string) {
    return this.prisma.apiKey.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string) {
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<{
    valid: boolean;
    keyId?: string;
    scopes?: string[];
    organizationId?: string | null;
  }> {
    const keyHash = hashSha256(key);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey) {
      return { valid: false };
    }

    if (apiKey.revokedAt) {
      return { valid: false };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false };
    }

    // Update usage stats
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    return {
      valid: true,
      keyId: apiKey.id,
      scopes: apiKey.scopes,
      organizationId: apiKey.organizationId,
    };
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get dashboard statistics
   */
  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      activeUsersThisWeek,
      totalOrganizations,
      activeSessions,
      mfaEnabledUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { lastSignInAt: { gte: sevenDaysAgo }, deletedAt: null },
      }),
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.session.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { mfaEnabled: true, deletedAt: null } }),
    ]);

    return {
      totalUsers,
      newUsersThisMonth,
      activeUsersThisWeek,
      totalOrganizations,
      activeSessions,
      mfaEnabledUsers,
      mfaAdoptionRate: totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0,
    };
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
  }) {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      mfaEnabled: user.mfaEnabled,
      publicMetadata: user.publicMetadata,
      unsafeMetadata: user.unsafeMetadata,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignInAt: user.lastSignInAt,
    };
  }
}

