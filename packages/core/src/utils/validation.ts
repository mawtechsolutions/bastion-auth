import { z } from 'zod';

import { PASSWORD_CONFIG } from '../constants/config.js';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_CONFIG.MIN_LENGTH, `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`)
  .max(PASSWORD_CONFIG.MAX_LENGTH, `Password must be at most ${PASSWORD_CONFIG.MAX_LENGTH} characters`)
  .refine(
    (password) => {
      if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return false;
      }
      if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return false;
      }
      if (PASSWORD_CONFIG.REQUIRE_NUMBER && !/\d/.test(password)) {
        return false;
      }
      if (PASSWORD_CONFIG.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
      }
      return true;
    },
    {
      message: 'Password must contain uppercase, lowercase, and a number',
    }
  );

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()
  .trim();

/**
 * Name validation schema (first/last name)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .trim();

/**
 * Optional name schema
 */
export const optionalNameSchema = nameSchema.optional().or(z.literal(''));

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * URL validation schema
 */
export const urlSchema = z.string().url('Invalid URL format');

/**
 * Organization slug validation schema
 */
export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .regex(/^[a-z]/, 'Slug must start with a letter')
  .regex(/[a-z0-9]$/, 'Slug must end with a letter or number');

/**
 * Sign up request schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
  username: usernameSchema.optional(),
});

/**
 * Sign in request schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * MFA verification schema
 */
export const mfaVerifySchema = z.object({
  mfaChallengeId: uuidSchema,
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
  method: z.enum(['totp', 'backup_code']),
});

/**
 * Magic link request schema
 */
export const magicLinkSchema = z.object({
  email: emailSchema,
  redirectUrl: urlSchema.optional(),
});

/**
 * Password reset request schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
  username: usernameSchema.optional(),
  imageUrl: urlSchema.optional().or(z.literal('')),
  unsafeMetadata: z.record(z.unknown()).optional(),
});

/**
 * Create organization schema
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  slug: slugSchema.optional(),
  imageUrl: urlSchema.optional(),
  maxMembers: z.number().int().positive().optional(),
  allowedDomains: z.array(z.string()).optional(),
});

/**
 * Update organization schema
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imageUrl: urlSchema.optional().or(z.literal('')),
  maxMembers: z.number().int().positive().nullable().optional(),
  allowedDomains: z.array(z.string()).optional(),
  publicMetadata: z.record(z.unknown()).optional(),
  privateMetadata: z.record(z.unknown()).optional(),
});

/**
 * Create invitation schema
 */
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.string().optional().default('member'),
});

/**
 * Create role schema
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  key: z
    .string()
    .min(1, 'Key is required')
    .max(30, 'Key must be at most 30 characters')
    .regex(/^[a-z_]+$/, 'Key can only contain lowercase letters and underscores'),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Create webhook schema
 */
export const createWebhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event is required'),
  enabled: z.boolean().optional().default(true),
  organizationId: uuidSchema.optional(),
});

/**
 * Update webhook schema
 */
export const updateWebhookSchema = z.object({
  url: urlSchema.optional(),
  events: z.array(z.string()).min(1).optional(),
  enabled: z.boolean().optional(),
});

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * List query schema (with pagination, sort, search)
 */
export const listQuerySchema = paginationSchema.extend({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

/**
 * Validate and parse data with a Zod schema
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validate (returns result object instead of throwing)
 */
export function safeValidateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

