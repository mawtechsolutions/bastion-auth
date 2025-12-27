import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { authenticate } from '../middleware/authenticate.js';
import { OrganizationService } from '../services/organization.service.js';
import { Errors } from '../lib/errors.js';

// Schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).optional(),
  imageUrl: z.string().url().optional(),
  maxMembers: z.number().int().positive().optional(),
  allowedDomains: z.array(z.string()).optional(),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url().nullable().optional(),
  maxMembers: z.number().int().positive().nullable().optional(),
  allowedDomains: z.array(z.string()).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export async function organizationsRoutes(app: FastifyInstance) {
  const organizationService = new OrganizationService(app.prisma);

  // Middleware to check org membership
  async function requireMembership(
    request: FastifyRequest<{ Params: { orgId: string } }>,
    _reply: FastifyReply
  ) {
    const { orgId } = request.params;
    const userId = request.user?.id;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const membership = await organizationService.getMembership(userId, orgId);
    if (!membership) {
      throw Errors.forbidden('You are not a member of this organization');
    }

    request.orgMembership = membership;
  }

  // Middleware to check admin/owner role
  async function requireAdmin(
    request: FastifyRequest<{ Params: { orgId: string } }>,
    _reply: FastifyReply
  ) {
    const membership = request.orgMembership;
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw Errors.forbidden('Admin or owner role required');
    }
  }

  // Middleware to check owner role
  async function requireOwner(
    request: FastifyRequest<{ Params: { orgId: string } }>,
    _reply: FastifyReply
  ) {
    const membership = request.orgMembership;
    if (!membership || membership.role !== 'owner') {
      throw Errors.forbidden('Owner role required');
    }
  }

  // ================================
  // List user's organizations
  // ================================
  app.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Organizations'],
        summary: 'List user organizations',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    imageUrl: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const organizations = await organizationService.getUserOrganizations(userId);
      return reply.send({ data: organizations });
    }
  );

  // ================================
  // Create organization
  // ================================
  app.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Organizations'],
        summary: 'Create new organization',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            slug: { type: 'string', minLength: 1, maxLength: 50 },
            imageUrl: { type: 'string', format: 'uri' },
            maxMembers: { type: 'integer', minimum: 1 },
            allowedDomains: { type: 'array', items: { type: 'string' } },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              imageUrl: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.id;
      const body = createOrganizationSchema.parse(request.body);
      const org = await organizationService.create(userId, body);
      return reply.status(201).send(org);
    }
  );

  // ================================
  // Get organization by ID or slug
  // ================================
  app.get(
    '/:orgId',
    {
      preHandler: [authenticate, requireMembership],
      schema: {
        tags: ['Organizations'],
        summary: 'Get organization details',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              imageUrl: { type: 'string', nullable: true },
              maxMembers: { type: 'integer', nullable: true },
              allowedDomains: { type: 'array', items: { type: 'string' } },
              publicMetadata: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
      const { orgId } = request.params;
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      return reply.send(org);
    }
  );

  // ================================
  // Update organization
  // ================================
  app.patch(
    '/:orgId',
    {
      preHandler: [authenticate, requireMembership, requireAdmin],
      schema: {
        tags: ['Organizations'],
        summary: 'Update organization',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            imageUrl: { type: 'string', format: 'uri', nullable: true },
            maxMembers: { type: 'integer', minimum: 1, nullable: true },
            allowedDomains: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
      const { orgId } = request.params;
      const body = updateOrganizationSchema.parse(request.body);
      
      // Need to get the actual org ID (in case slug was passed)
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      const updated = await organizationService.update(org.id, body);
      return reply.send(updated);
    }
  );

  // ================================
  // Delete organization
  // ================================
  app.delete(
    '/:orgId',
    {
      preHandler: [authenticate, requireMembership, requireOwner],
      schema: {
        tags: ['Organizations'],
        summary: 'Delete organization',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
      const { orgId } = request.params;
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      await organizationService.delete(org.id);
      return reply.status(204).send();
    }
  );

  // ================================
  // Get organization members
  // ================================
  app.get(
    '/:orgId/members',
    {
      preHandler: [authenticate, requireMembership],
      schema: {
        tags: ['Organizations'],
        summary: 'List organization members',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
      const { orgId } = request.params;
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      const members = await organizationService.getMembers(org.id);
      return reply.send({ data: members });
    }
  );

  // ================================
  // Update member role
  // ================================
  app.patch(
    '/:orgId/members/:memberId',
    {
      preHandler: [authenticate, requireMembership, requireAdmin],
      schema: {
        tags: ['Organizations'],
        summary: 'Update member role',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
            memberId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['admin', 'member'] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { orgId: string; memberId: string } }>,
      reply: FastifyReply
    ) => {
      const { orgId, memberId } = request.params;
      const body = updateMemberRoleSchema.parse(request.body);
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      await organizationService.updateMemberRole(org.id, memberId, body.role);
      return reply.send({ message: 'Role updated' });
    }
  );

  // ================================
  // Remove member
  // ================================
  app.delete(
    '/:orgId/members/:memberId',
    {
      preHandler: [authenticate, requireMembership, requireAdmin],
      schema: {
        tags: ['Organizations'],
        summary: 'Remove member from organization',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
            memberId: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { orgId: string; memberId: string } }>,
      reply: FastifyReply
    ) => {
      const { orgId, memberId } = request.params;
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      await organizationService.removeMember(org.id, memberId);
      return reply.status(204).send();
    }
  );

  // ================================
  // Invite member
  // ================================
  app.post(
    '/:orgId/invitations',
    {
      preHandler: [authenticate, requireMembership, requireAdmin],
      schema: {
        tags: ['Organizations'],
        summary: 'Invite member to organization',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
      const { orgId } = request.params;
      const userId = request.user!.id;
      const body = inviteMemberSchema.parse(request.body);
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      const result = await organizationService.createInvitation(
        org.id,
        body.email,
        body.role,
        userId
      );
      
      return reply.status(201).send({ message: 'Invitation sent', token: result.token });
    }
  );

  // ================================
  // Get pending invitations
  // ================================
  app.get(
    '/:orgId/invitations',
    {
      preHandler: [authenticate, requireMembership, requireAdmin],
      schema: {
        tags: ['Organizations'],
        summary: 'List pending invitations',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
      const { orgId } = request.params;
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      const invitations = await organizationService.getInvitations(org.id);
      return reply.send({ data: invitations });
    }
  );

  // ================================
  // Revoke invitation
  // ================================
  app.delete(
    '/:orgId/invitations/:invitationId',
    {
      preHandler: [authenticate, requireMembership, requireAdmin],
      schema: {
        tags: ['Organizations'],
        summary: 'Revoke invitation',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            orgId: { type: 'string' },
            invitationId: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { orgId: string; invitationId: string } }>,
      reply: FastifyReply
    ) => {
      const { orgId, invitationId } = request.params;
      
      const org = await organizationService.getByIdOrSlug(orgId);
      if (!org) {
        throw Errors.notFound('Organization not found');
      }
      
      await organizationService.revokeInvitation(org.id, invitationId);
      return reply.status(204).send();
    }
  );

  // ================================
  // Accept invitation (public route with token)
  // ================================
  app.post(
    '/invitations/:token/accept',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Organizations'],
        summary: 'Accept organization invitation',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { token: string } }>,
      reply: FastifyReply
    ) => {
      const { token } = request.params;
      const userId = request.user!.id;
      
      const org = await organizationService.acceptInvitation(userId, token);
      return reply.send({ message: 'Invitation accepted', organization: org });
    }
  );
}

