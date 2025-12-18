import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ActorType, AuditAction, AuditStatus } from '@bastionauth/core';

import { getClientIp, getGeoFromIp } from '../utils/fingerprint.js';

interface AuditLogData {
  userId?: string | null;
  actorType?: ActorType;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  status?: AuditStatus;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  request: FastifyRequest,
  data: AuditLogData
): Promise<void> {
  const ipAddress = getClientIp(request);
  const userAgent = request.headers['user-agent'] || '';
  const geo = await getGeoFromIp(ipAddress);

  try {
    await request.server.prisma.auditLog.create({
      data: {
        userId: data.userId ?? request.userId ?? null,
        actorType: data.actorType ?? (request.userId ? 'USER' : 'SYSTEM'),
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        ipAddress,
        userAgent,
        country: geo.country,
        city: geo.city,
        metadata: data.metadata ?? {},
        status: data.status ?? 'SUCCESS',
      },
    });
  } catch (error) {
    // Don't let audit logging failures break the request
    request.log.error({ err: error }, 'Failed to create audit log');
  }
}

/**
 * Audit logging hook for sensitive operations
 */
export function auditHook(action: AuditAction | string, entityType?: string) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    // Store audit info on request for later use
    request.auditAction = action;
    request.auditEntityType = entityType;
  };
}

// Extend FastifyRequest to include audit info
declare module 'fastify' {
  interface FastifyRequest {
    auditAction?: string;
    auditEntityType?: string;
  }
}

