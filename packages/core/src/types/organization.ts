import type { JsonValue } from './api.js';

/**
 * Organization entity
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  maxMembers: number | null;
  allowedDomains: string[];
  publicMetadata: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization with private data (server-only)
 */
export interface OrganizationWithPrivateData extends Organization {
  privateMetadata: JsonValue;
  deletedAt: Date | null;
}

/**
 * Organization creation input
 */
export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  imageUrl?: string;
  maxMembers?: number;
  allowedDomains?: string[];
  publicMetadata?: JsonValue;
  privateMetadata?: JsonValue;
}

/**
 * Organization update input
 */
export interface UpdateOrganizationInput {
  name?: string;
  imageUrl?: string;
  maxMembers?: number;
  allowedDomains?: string[];
  publicMetadata?: JsonValue;
  privateMetadata?: JsonValue;
}

/**
 * Organization membership
 */
export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Membership with user details
 */
export interface OrganizationMembershipWithUser extends OrganizationMembership {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

/**
 * Organization and membership combined (for user's org list)
 */
export interface OrganizationWithMembership {
  organization: Organization;
  membership: OrganizationMembership;
}

/**
 * Organization role definition
 */
export interface OrganizationRole {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  permissions: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role creation input
 */
export interface CreateOrganizationRoleInput {
  name: string;
  key: string;
  description?: string;
  permissions: string[];
  isDefault?: boolean;
}

/**
 * Invitation status
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/**
 * Organization invitation
 */
export interface OrganizationInvitation {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedById: string | null;
  createdAt: Date;
}

/**
 * Invitation creation input
 */
export interface CreateInvitationInput {
  email: string;
  role?: string;
}

/**
 * Built-in organization roles
 */
export const BUILT_IN_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

/**
 * Built-in permissions
 */
export const PERMISSIONS = {
  // Organization management
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',

  // Member management
  MEMBERS_READ: 'members:read',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_UPDATE: 'members:update',
  MEMBERS_REMOVE: 'members:remove',

  // Role management
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',

  // All permissions (owner)
  ALL: '*',
} as const;

/**
 * Default role permissions
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [PERMISSIONS.ALL],
  admin: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_UPDATE,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.ROLES_READ,
  ],
  member: [PERMISSIONS.ORG_READ, PERMISSIONS.MEMBERS_READ],
};

