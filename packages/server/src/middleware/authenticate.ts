import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AccessTokenPayload } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { verifyAccessToken } from '../utils/tokens.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
    userId?: string;
    sessionId?: string;
    orgId?: string;
    orgRole?: string;
    orgMembership?: {
      id: string;
      userId: string;
      organizationId: string;
      role: string;
      permissions: string[];
      organizationRole?: {
        id: string;
        name: string;
        key: string;
        permissions: string[];
      } | null;
    };
  }
}

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Authentication middleware - requires valid access token
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    throw Errors.invalidToken('No token provided');
  }

  try {
    const payload = await verifyAccessToken(token);

    // Check if session is still valid in database
    const session = await request.server.prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: { status: true, userId: true },
    });

    if (!session) {
      throw Errors.sessionNotFound();
    }

    if (session.status !== 'ACTIVE') {
      throw Errors.sessionRevoked();
    }

    // Verify user ID matches
    if (session.userId !== payload.sub) {
      throw Errors.invalidToken('Token user mismatch');
    }

    // Attach user info to request
    request.user = payload;
    request.userId = payload.sub;
    request.sessionId = payload.sessionId;
    request.orgId = payload.orgId;
    request.orgRole = payload.orgRole;
  } catch (error) {
    if (error instanceof Error && error.name === 'JWTExpired') {
      throw Errors.tokenExpired();
    }
    if (error instanceof Error && error.name === 'JWTClaimValidationFailed') {
      throw Errors.invalidToken('Token validation failed');
    }
    throw error;
  }
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    return; // No token, continue without auth
  }

  try {
    const payload = await verifyAccessToken(token);

    // Check if session is still valid
    const session = await request.server.prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: { status: true },
    });

    if (session?.status === 'ACTIVE') {
      request.user = payload;
      request.userId = payload.sub;
      request.sessionId = payload.sessionId;
      request.orgId = payload.orgId;
      request.orgRole = payload.orgRole;
    }
  } catch {
    // Ignore errors for optional auth
  }
}

/**
 * Require organization membership
 */
export async function requireOrganization(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);

  if (!request.orgId) {
    throw Errors.insufficientPermissions();
  }
}

/**
 * Require specific organization permission
 */
export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireOrganization(request, reply);

    // Get user's membership
    const membership = await request.server.prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: request.userId!,
          organizationId: request.orgId!,
        },
      },
      include: {
        organizationRole: true,
      },
    });

    if (!membership) {
      throw Errors.insufficientPermissions();
    }

    // Check if user has required permission
    const userPermissions = [
      ...membership.permissions,
      ...(membership.organizationRole?.permissions || []),
    ];

    // Owner has all permissions
    if (membership.role === 'owner' || userPermissions.includes('*')) {
      return;
    }

    const hasPermission = permissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw Errors.insufficientPermissions();
    }
  };
}

