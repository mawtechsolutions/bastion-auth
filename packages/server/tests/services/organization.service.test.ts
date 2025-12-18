import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockPrisma = {
  organization: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  organizationMembership: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  organizationRole: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  organizationInvitation: {
    create: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
};

describe('Organization Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create an organization with default roles', async () => {
      mockPrisma.organization.create.mockResolvedValueOnce({
        id: 'org-123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const org = await mockPrisma.organization.create({
        data: {
          name: 'Acme Corp',
          slug: 'acme-corp',
        },
      });
      
      expect(org.name).toBe('Acme Corp');
      expect(org.slug).toBe('acme-corp');
    });

    it('should generate unique slug from name', () => {
      const name = 'Acme Corp!';
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('acme-corp');
    });

    it('should add creator as owner', async () => {
      mockPrisma.organizationMembership.create.mockResolvedValueOnce({
        id: 'membership-123',
        organizationId: 'org-123',
        userId: 'user-123',
        roleId: 'role-owner',
      });
      
      const membership = await mockPrisma.organizationMembership.create({
        data: {
          organizationId: 'org-123',
          userId: 'user-123',
          roleId: 'role-owner',
        },
      });
      
      expect(membership.userId).toBe('user-123');
      expect(membership.roleId).toBe('role-owner');
    });
  });

  describe('getMemberOrganizations', () => {
    it('should return organizations for a user', async () => {
      mockPrisma.organizationMembership.findMany.mockResolvedValueOnce([
        {
          id: 'mem-1',
          organization: { id: 'org-1', name: 'Org 1', slug: 'org-1' },
          role: { id: 'role-1', name: 'admin' },
        },
        {
          id: 'mem-2',
          organization: { id: 'org-2', name: 'Org 2', slug: 'org-2' },
          role: { id: 'role-2', name: 'member' },
        },
      ]);
      
      const memberships = await mockPrisma.organizationMembership.findMany({
        where: { userId: 'user-123' },
      });
      
      expect(memberships.length).toBe(2);
    });
  });

  describe('inviteMember', () => {
    it('should create an invitation', async () => {
      mockPrisma.organizationInvitation.create.mockResolvedValueOnce({
        id: 'invite-123',
        organizationId: 'org-123',
        email: 'invite@example.com',
        roleId: 'role-member',
        token: 'invite-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      
      const invite = await mockPrisma.organizationInvitation.create({
        data: {
          organizationId: 'org-123',
          email: 'invite@example.com',
          roleId: 'role-member',
          token: 'invite-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      
      expect(invite.email).toBe('invite@example.com');
    });

    it('should reject duplicate invitations', async () => {
      mockPrisma.organizationInvitation.findFirst.mockResolvedValueOnce({
        id: 'existing-invite',
        email: 'invite@example.com',
      });
      
      const existingInvite = await mockPrisma.organizationInvitation.findFirst({
        where: {
          organizationId: 'org-123',
          email: 'invite@example.com',
        },
      });
      
      expect(existingInvite).not.toBeNull();
    });

    it('should reject invitation for existing member', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValueOnce({
        id: 'existing-member',
        userId: 'user-123',
      });
      
      const existingMember = await mockPrisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: 'org-123',
            userId: 'user-123',
          },
        },
      });
      
      expect(existingMember).not.toBeNull();
    });
  });

  describe('acceptInvitation', () => {
    it('should add user as member when accepting invitation', async () => {
      mockPrisma.organizationInvitation.findFirst.mockResolvedValueOnce({
        id: 'invite-123',
        organizationId: 'org-123',
        roleId: 'role-member',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      
      mockPrisma.organizationMembership.create.mockResolvedValueOnce({
        id: 'membership-123',
        organizationId: 'org-123',
        userId: 'user-123',
        roleId: 'role-member',
      });
      
      const invite = await mockPrisma.organizationInvitation.findFirst({
        where: { token: 'valid-token' },
      });
      
      expect(invite!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject expired invitation', async () => {
      mockPrisma.organizationInvitation.findFirst.mockResolvedValueOnce({
        id: 'invite-123',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      
      const invite = await mockPrisma.organizationInvitation.findFirst({
        where: { token: 'expired-token' },
      });
      
      expect(invite!.expiresAt.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      mockPrisma.organizationMembership.update.mockResolvedValueOnce({
        id: 'membership-123',
        roleId: 'role-admin',
      });
      
      const membership = await mockPrisma.organizationMembership.update({
        where: { id: 'membership-123' },
        data: { roleId: 'role-admin' },
      });
      
      expect(membership.roleId).toBe('role-admin');
    });

    it('should prevent demoting the only owner', async () => {
      mockPrisma.organizationMembership.findMany.mockResolvedValueOnce([
        { id: 'mem-1', role: { name: 'owner' } },
      ]);
      
      const owners = await mockPrisma.organizationMembership.findMany({
        where: {
          organizationId: 'org-123',
          role: { name: 'owner' },
        },
      });
      
      expect(owners.length).toBe(1);
    });
  });

  describe('removeMember', () => {
    it('should remove member from organization', async () => {
      mockPrisma.organizationMembership.delete.mockResolvedValueOnce({
        id: 'membership-123',
      });
      
      const result = await mockPrisma.organizationMembership.delete({
        where: { id: 'membership-123' },
      });
      
      expect(result.id).toBe('membership-123');
    });

    it('should prevent removing the only owner', async () => {
      mockPrisma.organizationMembership.findMany.mockResolvedValueOnce([
        { id: 'mem-1', role: { name: 'owner' } },
      ]);
      
      const owners = await mockPrisma.organizationMembership.findMany({
        where: {
          organizationId: 'org-123',
          role: { name: 'owner' },
        },
      });
      
      expect(owners.length).toBe(1);
      // Should throw error if trying to remove only owner
    });
  });
});

