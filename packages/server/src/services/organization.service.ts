import type { PrismaClient } from '@prisma/client';

import {
  ORGANIZATION_CONFIG,
  DEFAULT_ROLE_PERMISSIONS,
} from '@bastionauth/core';
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationMembershipWithUser,
  UpdateOrganizationInput,
} from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { generateSlug } from '@bastionauth/core';
import { generateInvitationToken } from '../utils/tokens.js';

export class OrganizationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new organization
   */
  async create(
    userId: string,
    data: CreateOrganizationInput
  ): Promise<Organization> {
    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.name);

    // Check slug uniqueness
    const existingSlug = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingSlug) {
      // Append random suffix
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create organization with owner membership
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug,
        imageUrl: data.imageUrl,
        maxMembers: data.maxMembers,
        allowedDomains: data.allowedDomains || [],
        publicMetadata: data.publicMetadata || {},
        privateMetadata: data.privateMetadata || {},
        memberships: {
          create: {
            userId,
            role: 'owner',
            permissions: ['*'],
          },
        },
      },
    });

    return this.sanitizeOrganization(org);
  }

  /**
   * Get organization by ID or slug
   */
  async getByIdOrSlug(idOrSlug: string): Promise<Organization | null> {
    const org = await this.prisma.organization.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        deletedAt: null,
      },
    });

    return org ? this.sanitizeOrganization(org) : null;
  }

  /**
   * Update organization
   */
  async update(
    orgId: string,
    data: UpdateOrganizationInput
  ): Promise<Organization> {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        maxMembers: data.maxMembers,
        allowedDomains: data.allowedDomains,
        publicMetadata: data.publicMetadata,
        privateMetadata: data.privateMetadata,
      },
    });

    return this.sanitizeOrganization(org);
  }

  /**
   * Delete organization (soft delete)
   */
  async delete(orgId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    return memberships
      .filter((m) => !m.organization.deletedAt)
      .map((m) => this.sanitizeOrganization(m.organization));
  }

  /**
   * Get organization members
   */
  async getMembers(orgId: string): Promise<OrganizationMembershipWithUser[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
      permissions: m.permissions,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      user: m.user,
    }));
  }

  /**
   * Get user's membership in an organization
   */
  async getMembership(
    userId: string,
    orgId: string
  ) {
    return this.prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
      include: {
        organizationRole: true,
      },
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: string
  ): Promise<void> {
    // Get the membership
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { id: memberId, organizationId: orgId },
    });

    if (!membership) {
      throw Errors.memberNotFound();
    }

    // Can't change owner's role
    if (membership.role === 'owner') {
      throw Errors.cannotDemoteOwner();
    }

    // Get default permissions for the role
    const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

    await this.prisma.organizationMembership.update({
      where: { id: memberId },
      data: { role, permissions },
    });
  }

  /**
   * Remove member from organization
   */
  async removeMember(orgId: string, memberId: string): Promise<void> {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { id: memberId, organizationId: orgId },
    });

    if (!membership) {
      throw Errors.memberNotFound();
    }

    if (membership.role === 'owner') {
      throw Errors.cannotRemoveOwner();
    }

    await this.prisma.organizationMembership.delete({
      where: { id: memberId },
    });
  }

  /**
   * Create invitation
   */
  async createInvitation(
    orgId: string,
    email: string,
    role: string,
    invitedById?: string
  ): Promise<{ token: string }> {
    // Check if user is already a member
    const existingMember = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId: orgId,
        user: { email },
      },
    });

    if (existingMember) {
      throw Errors.memberAlreadyExists();
    }

    // Check max members
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        maxMembers: true,
        _count: { select: { memberships: true } },
      },
    });

    if (org?.maxMembers && org._count.memberships >= org.maxMembers) {
      throw Errors.invalidInput('Organization has reached its member limit');
    }

    const token = generateInvitationToken();

    await this.prisma.organizationInvitation.create({
      data: {
        email,
        organizationId: orgId,
        role,
        token,
        expiresAt: new Date(
          Date.now() + ORGANIZATION_CONFIG.INVITATION_EXPIRY_SECONDS * 1000
        ),
        invitedById,
      },
    });

    return { token };
  }

  /**
   * Get pending invitations
   */
  async getInvitations(orgId: string) {
    return this.prisma.organizationInvitation.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(userId: string, token: string): Promise<Organization> {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation) {
      throw Errors.invitationNotFound();
    }

    if (invitation.status !== 'PENDING') {
      throw Errors.invitationExpired();
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw Errors.invitationExpired();
    }

    // Check if user email matches
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw Errors.invalidInput('This invitation was sent to a different email address');
    }

    // Create membership
    await this.prisma.$transaction([
      this.prisma.organizationMembership.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
          permissions: DEFAULT_ROLE_PERMISSIONS[invitation.role] || [],
        },
      }),
      this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      }),
    ]);

    return this.sanitizeOrganization(invitation.organization);
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(orgId: string, invitationId: string): Promise<void> {
    await this.prisma.organizationInvitation.updateMany({
      where: {
        id: invitationId,
        organizationId: orgId,
        status: 'PENDING',
      },
      data: { status: 'REVOKED' },
    });
  }

  private sanitizeOrganization(org: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    maxMembers: number | null;
    allowedDomains: string[];
    publicMetadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Organization {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      imageUrl: org.imageUrl,
      maxMembers: org.maxMembers,
      allowedDomains: org.allowedDomains,
      publicMetadata: org.publicMetadata as Record<string, unknown>,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}

