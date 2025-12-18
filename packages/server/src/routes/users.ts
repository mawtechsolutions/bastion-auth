import type { FastifyInstance } from 'fastify';

import { changePasswordSchema, updateUserSchema } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { createAuditLog } from '../middleware/audit.js';
import { MfaService, UserService } from '../services/index.js';

export async function usersRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);
  const mfaService = new MfaService(fastify.prisma);

  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // ============================================
  // GET CURRENT USER
  // ============================================
  fastify.get(
    '/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await userService.getById(request.userId!);

      if (!user) {
        throw Errors.userNotFound();
      }

      return reply.send(user);
    }
  );

  // ============================================
  // UPDATE CURRENT USER
  // ============================================
  fastify.patch(
    '/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update current user',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            imageUrl: { type: 'string' },
            unsafeMetadata: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      const data = updateUserSchema.parse(request.body);
      const user = await userService.update(request.userId!, data);

      await createAuditLog(request, {
        action: 'user.updated',
        entityType: 'user',
        entityId: request.userId,
        metadata: { changes: Object.keys(data) },
      });

      return reply.send({ user });
    }
  );

  // ============================================
  // DELETE CURRENT USER
  // ============================================
  fastify.delete(
    '/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Delete current user',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      await userService.delete(request.userId!);

      await createAuditLog(request, {
        action: 'user.deleted',
        entityType: 'user',
        entityId: request.userId,
      });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  fastify.patch(
    '/me/password',
    {
      schema: {
        tags: ['Users'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const data = changePasswordSchema.parse(request.body);

      await userService.changePassword(
        request.userId!,
        data.currentPassword,
        data.newPassword
      );

      await createAuditLog(request, {
        action: 'password.changed',
        entityType: 'user',
        entityId: request.userId,
      });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // MFA SETUP
  // ============================================
  fastify.post(
    '/me/mfa/totp',
    {
      schema: {
        tags: ['Users', 'MFA'],
        summary: 'Start MFA setup',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await mfaService.initSetup(request.userId!);

      return reply.send(result);
    }
  );

  // ============================================
  // MFA VERIFY AND ENABLE
  // ============================================
  fastify.post(
    '/me/mfa/totp/verify',
    {
      schema: {
        tags: ['Users', 'MFA'],
        summary: 'Verify TOTP and enable MFA',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body as { code: string };

      const success = await mfaService.verifyAndEnable(request.userId!, code);

      if (!success) {
        throw Errors.mfaInvalidCode();
      }

      await createAuditLog(request, {
        action: 'mfa.enabled',
        entityType: 'user',
        entityId: request.userId,
      });

      return reply.send({
        success: true,
        mfaEnabled: true,
      });
    }
  );

  // ============================================
  // MFA DISABLE
  // ============================================
  fastify.delete(
    '/me/mfa',
    {
      schema: {
        tags: ['Users', 'MFA'],
        summary: 'Disable MFA',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { password } = request.body as { password: string };

      await mfaService.disable(request.userId!, password);

      await createAuditLog(request, {
        action: 'mfa.disabled',
        entityType: 'user',
        entityId: request.userId,
      });

      return reply.send({
        success: true,
        mfaEnabled: false,
      });
    }
  );

  // ============================================
  // GET BACKUP CODES
  // ============================================
  fastify.post(
    '/me/mfa/backup-codes',
    {
      schema: {
        tags: ['Users', 'MFA'],
        summary: 'Get MFA backup codes',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { password } = request.body as { password: string };

      const backupCodes = await mfaService.getBackupCodes(request.userId!, password);

      return reply.send({ backupCodes });
    }
  );

  // ============================================
  // REGENERATE BACKUP CODES
  // ============================================
  fastify.post(
    '/me/mfa/backup-codes/regenerate',
    {
      schema: {
        tags: ['Users', 'MFA'],
        summary: 'Regenerate MFA backup codes',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { password } = request.body as { password: string };

      const backupCodes = await mfaService.regenerateBackupCodes(request.userId!, password);

      await createAuditLog(request, {
        action: 'mfa.backup_codes_regenerated',
        entityType: 'user',
        entityId: request.userId,
      });

      return reply.send({ backupCodes });
    }
  );

  // ============================================
  // GET SESSIONS
  // ============================================
  fastify.get(
    '/me/sessions',
    {
      schema: {
        tags: ['Users', 'Sessions'],
        summary: 'Get active sessions',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const sessions = await userService.getSessions(request.userId!, request.sessionId);

      return reply.send({ sessions });
    }
  );

  // ============================================
  // REVOKE SESSION
  // ============================================
  fastify.delete(
    '/me/sessions/:sessionId',
    {
      schema: {
        tags: ['Users', 'Sessions'],
        summary: 'Revoke a session',
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

      await userService.revokeSession(request.userId!, sessionId);

      await createAuditLog(request, {
        action: 'session.revoked',
        entityType: 'session',
        entityId: sessionId,
      });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // GET OAUTH ACCOUNTS
  // ============================================
  fastify.get(
    '/me/oauth-accounts',
    {
      schema: {
        tags: ['Users', 'OAuth'],
        summary: 'Get linked OAuth accounts',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const accounts = await userService.getOAuthAccounts(request.userId!);

      return reply.send({ accounts });
    }
  );

  // ============================================
  // REMOVE OAUTH ACCOUNT
  // ============================================
  fastify.delete(
    '/me/oauth-accounts/:accountId',
    {
      schema: {
        tags: ['Users', 'OAuth'],
        summary: 'Remove an OAuth account',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['accountId'],
          properties: {
            accountId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { accountId } = request.params as { accountId: string };

      await userService.removeOAuthAccount(request.userId!, accountId);

      await createAuditLog(request, {
        action: 'oauth.disconnected',
        entityType: 'oauth_account',
        entityId: accountId,
      });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // GET PASSKEYS
  // ============================================
  fastify.get(
    '/me/passkeys',
    {
      schema: {
        tags: ['Users', 'Passkeys'],
        summary: 'Get passkeys',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const passkeys = await userService.getPasskeys(request.userId!);

      return reply.send({ passkeys });
    }
  );

  // ============================================
  // REMOVE PASSKEY
  // ============================================
  fastify.delete(
    '/me/passkeys/:passkeyId',
    {
      schema: {
        tags: ['Users', 'Passkeys'],
        summary: 'Remove a passkey',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['passkeyId'],
          properties: {
            passkeyId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { passkeyId } = request.params as { passkeyId: string };

      await userService.removePasskey(request.userId!, passkeyId);

      await createAuditLog(request, {
        action: 'passkey.removed',
        entityType: 'passkey',
        entityId: passkeyId,
      });

      return reply.send({ success: true });
    }
  );
}

