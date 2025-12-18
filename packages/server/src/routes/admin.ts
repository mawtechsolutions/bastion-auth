import type { FastifyInstance } from 'fastify';

import { listQuerySchema } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { createAuditLog } from '../middleware/audit.js';
import { AdminService } from '../services/admin.service.js';

/**
 * Admin middleware - checks if user has admin privileges
 */
async function requireAdmin(request: any) {
  if (!request.userId) {
    throw Errors.invalidToken('Authentication required');
  }

  // Check if user has admin role in public metadata
  const user = await request.server.prisma.user.findUnique({
    where: { id: request.userId },
    select: { publicMetadata: true, privateMetadata: true },
  });

  const isAdmin =
    (user?.privateMetadata as Record<string, unknown>)?.isSystemAdmin === true ||
    (user?.publicMetadata as Record<string, unknown>)?.role === 'admin';

  if (!isAdmin) {
    throw Errors.insufficientPermissions();
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  const adminService = new AdminService(fastify.prisma);

  // All admin routes require authentication and admin role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireAdmin);

  // ============================================
  // STATISTICS
  // ============================================
  fastify.get(
    '/stats',
    {
      schema: {
        tags: ['Admin'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const stats = await adminService.getStats();
      return reply.send(stats);
    }
  );

  // ============================================
  // USERS
  // ============================================
  fastify.get(
    '/users',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            search: { type: 'string' },
            sort: { type: 'string' },
            order: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
      },
    },
    async (request, reply) => {
      const params = listQuerySchema.parse(request.query);
      const result = await adminService.listUsers(params);
      return reply.send(result);
    }
  );

  fastify.get(
    '/users/:userId',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const user = await adminService.getUser(userId);
      return reply.send(user);
    }
  );

  fastify.patch(
    '/users/:userId',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            emailVerified: { type: 'boolean' },
            publicMetadata: { type: 'object' },
            privateMetadata: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const data = request.body as Record<string, unknown>;

      const user = await adminService.updateUser(userId, data);

      await createAuditLog(request, {
        action: 'admin.user_updated',
        entityType: 'user',
        entityId: userId,
        actorType: 'ADMIN',
        metadata: { changes: Object.keys(data) },
      });

      return reply.send({ user });
    }
  );

  fastify.post(
    '/users/:userId/ban',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Ban user',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            duration: { type: 'number', description: 'Duration in seconds (null for permanent)' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const { duration } = (request.body || {}) as { duration?: number };

      await adminService.banUser(userId, duration);

      await createAuditLog(request, {
        action: 'admin.user_banned',
        entityType: 'user',
        entityId: userId,
        actorType: 'ADMIN',
        metadata: { duration: duration || 'permanent' },
      });

      return reply.send({ success: true });
    }
  );

  fastify.post(
    '/users/:userId/unban',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Unban user',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      await adminService.unbanUser(userId);

      await createAuditLog(request, {
        action: 'admin.user_unbanned',
        entityType: 'user',
        entityId: userId,
        actorType: 'ADMIN',
      });

      return reply.send({ success: true });
    }
  );

  fastify.delete(
    '/users/:userId',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Delete user permanently',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      await adminService.deleteUser(userId);

      await createAuditLog(request, {
        action: 'admin.user_deleted',
        entityType: 'user',
        entityId: userId,
        actorType: 'ADMIN',
      });

      return reply.send({ success: true });
    }
  );

  fastify.post(
    '/users/:userId/impersonate',
    {
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Impersonate user',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      const tokens = await adminService.impersonateUser(userId, request.userId!);

      await createAuditLog(request, {
        action: 'admin.user_impersonated',
        entityType: 'user',
        entityId: userId,
        actorType: 'ADMIN',
      });

      return reply.send(tokens);
    }
  );

  // ============================================
  // SESSIONS
  // ============================================
  fastify.get(
    '/sessions',
    {
      schema: {
        tags: ['Admin', 'Sessions'],
        summary: 'List all sessions',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.query as { page?: number; limit?: number; userId?: string };
      const result = await adminService.listSessions(params);
      return reply.send(result);
    }
  );

  fastify.delete(
    '/sessions/:sessionId',
    {
      schema: {
        tags: ['Admin', 'Sessions'],
        summary: 'Revoke session',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['sessionId'],
          properties: {
            sessionId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };

      await adminService.revokeSession(sessionId);

      await createAuditLog(request, {
        action: 'admin.session_revoked',
        entityType: 'session',
        entityId: sessionId,
        actorType: 'ADMIN',
      });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // ORGANIZATIONS
  // ============================================
  fastify.get(
    '/organizations',
    {
      schema: {
        tags: ['Admin', 'Organizations'],
        summary: 'List all organizations',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            search: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const params = listQuerySchema.parse(request.query);
      const result = await adminService.listOrganizations(params);
      return reply.send(result);
    }
  );

  // ============================================
  // AUDIT LOGS
  // ============================================
  fastify.get(
    '/audit-logs',
    {
      schema: {
        tags: ['Admin', 'Audit'],
        summary: 'List audit logs',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            userId: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            entityType: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.query as Record<string, string | number | undefined>;
      const result = await adminService.listAuditLogs({
        ...params,
        startDate: params.startDate ? new Date(params.startDate as string) : undefined,
        endDate: params.endDate ? new Date(params.endDate as string) : undefined,
      });
      return reply.send(result);
    }
  );

  // ============================================
  // API KEYS
  // ============================================
  fastify.get(
    '/api-keys',
    {
      schema: {
        tags: ['Admin', 'API Keys'],
        summary: 'List API keys',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const keys = await adminService.listApiKeys();
      return reply.send({ keys });
    }
  );

  fastify.post(
    '/api-keys',
    {
      schema: {
        tags: ['Admin', 'API Keys'],
        summary: 'Create API key',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            scopes: { type: 'array', items: { type: 'string' } },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request, reply) => {
      const data = request.body as { name: string; scopes?: string[]; expiresAt?: string };

      const key = await adminService.createApiKey({
        name: data.name,
        scopes: data.scopes,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      await createAuditLog(request, {
        action: 'api_key.created',
        entityType: 'api_key',
        entityId: key.id,
        actorType: 'ADMIN',
      });

      return reply.status(201).send(key);
    }
  );

  fastify.delete(
    '/api-keys/:keyId',
    {
      schema: {
        tags: ['Admin', 'API Keys'],
        summary: 'Revoke API key',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['keyId'],
          properties: {
            keyId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { keyId } = request.params as { keyId: string };

      await adminService.revokeApiKey(keyId);

      await createAuditLog(request, {
        action: 'api_key.revoked',
        entityType: 'api_key',
        entityId: keyId,
        actorType: 'ADMIN',
      });

      return reply.send({ success: true });
    }
  );
}

