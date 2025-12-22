import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
  type ErrorCode,
} from '@bastionauth/core';

/**
 * Base API error class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message || ERROR_MESSAGES[code]);
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.details = details;
    this.name = 'ApiError';

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Shorthand error creators
 */
export const Errors = {
  // Authentication
  invalidCredentials: (details?: Record<string, unknown>) =>
    new ApiError(ERROR_CODES.INVALID_CREDENTIALS, undefined, details),

  invalidToken: (message?: string) =>
    new ApiError(ERROR_CODES.INVALID_TOKEN, message),

  tokenExpired: () =>
    new ApiError(ERROR_CODES.TOKEN_EXPIRED),

  sessionNotFound: () =>
    new ApiError(ERROR_CODES.SESSION_NOT_FOUND),

  sessionRevoked: () =>
    new ApiError(ERROR_CODES.SESSION_REVOKED),

  mfaRequired: (details?: Record<string, unknown>) =>
    new ApiError(ERROR_CODES.MFA_REQUIRED, undefined, details),

  mfaInvalidCode: () =>
    new ApiError(ERROR_CODES.MFA_INVALID_CODE),

  mfaNotEnabled: () =>
    new ApiError(ERROR_CODES.MFA_NOT_ENABLED),

  mfaAlreadyEnabled: () =>
    new ApiError(ERROR_CODES.MFA_ALREADY_ENABLED),

  // User
  userNotFound: () =>
    new ApiError(ERROR_CODES.USER_NOT_FOUND),

  userAlreadyExists: () =>
    new ApiError(ERROR_CODES.USER_ALREADY_EXISTS),

  emailAlreadyExists: () =>
    new ApiError(ERROR_CODES.EMAIL_ALREADY_EXISTS),

  usernameAlreadyExists: () =>
    new ApiError(ERROR_CODES.USERNAME_ALREADY_EXISTS),

  emailNotVerified: () =>
    new ApiError(ERROR_CODES.EMAIL_NOT_VERIFIED),

  userLocked: (lockedUntil?: Date) =>
    new ApiError(ERROR_CODES.USER_LOCKED, undefined, { lockedUntil }),

  userDeleted: () =>
    new ApiError(ERROR_CODES.USER_DELETED),

  invalidPassword: () =>
    new ApiError(ERROR_CODES.INVALID_PASSWORD),

  passwordTooWeak: (requirements?: string[]) =>
    new ApiError(ERROR_CODES.PASSWORD_TOO_WEAK, undefined, { requirements }),

  passwordBreached: () =>
    new ApiError(ERROR_CODES.PASSWORD_BREACHED),

  samePassword: () =>
    new ApiError(ERROR_CODES.SAME_PASSWORD),

  // Organization
  organizationNotFound: () =>
    new ApiError(ERROR_CODES.ORGANIZATION_NOT_FOUND),

  slugAlreadyExists: () =>
    new ApiError(ERROR_CODES.SLUG_ALREADY_EXISTS),

  memberNotFound: () =>
    new ApiError(ERROR_CODES.MEMBER_NOT_FOUND),

  memberAlreadyExists: () =>
    new ApiError(ERROR_CODES.MEMBER_ALREADY_EXISTS),

  invitationNotFound: () =>
    new ApiError(ERROR_CODES.INVITATION_NOT_FOUND),

  invitationExpired: () =>
    new ApiError(ERROR_CODES.INVITATION_EXPIRED),

  insufficientPermissions: () =>
    new ApiError(ERROR_CODES.INSUFFICIENT_PERMISSIONS),

  cannotRemoveOwner: () =>
    new ApiError(ERROR_CODES.CANNOT_REMOVE_OWNER),

  // Validation
  validationError: (details: Record<string, unknown>) =>
    new ApiError(ERROR_CODES.VALIDATION_ERROR, undefined, details),

  invalidInput: (message: string) =>
    new ApiError(ERROR_CODES.INVALID_INPUT, message),

  // Rate limiting
  rateLimitExceeded: (retryAfter?: number) =>
    new ApiError(ERROR_CODES.RATE_LIMIT_EXCEEDED, undefined, { retryAfter }),

  tooManyFailedAttempts: (retryAfter?: number) =>
    new ApiError(ERROR_CODES.TOO_MANY_FAILED_ATTEMPTS, undefined, { retryAfter }),

  // Server
  internalError: (message?: string) =>
    new ApiError(ERROR_CODES.INTERNAL_ERROR, message),

  // OAuth
  oauthError: (message: string) =>
    new ApiError(ERROR_CODES.OAUTH_ERROR, message),

  oauthStateMismatch: () =>
    new ApiError(ERROR_CODES.OAUTH_STATE_MISMATCH),

  oauthAccountExists: () =>
    new ApiError(ERROR_CODES.OAUTH_ACCOUNT_EXISTS),

  oauthProviderNotConfigured: (provider: string) =>
    new ApiError(ERROR_CODES.OAUTH_ERROR, `OAuth provider '${provider}' is not configured`),

  // Webhook
  webhookNotFound: () =>
    new ApiError(ERROR_CODES.WEBHOOK_NOT_FOUND),

  // API Key
  apiKeyNotFound: () =>
    new ApiError(ERROR_CODES.API_KEY_NOT_FOUND),

  invalidApiKey: () =>
    new ApiError(ERROR_CODES.INVALID_API_KEY),

  insufficientScope: (required: string[]) =>
    new ApiError(ERROR_CODES.INSUFFICIENT_SCOPE, undefined, { required }),
};

/**
 * Error handler for Fastify
 */
export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error({ err: error }, 'Request error');

  // Handle ApiError
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send(error.toJSON());
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { issues: (error as unknown as { issues: unknown[] }).issues },
      },
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.[0];
      if (target === 'email') {
        return reply.status(409).send(Errors.emailAlreadyExists().toJSON());
      }
      if (target === 'username') {
        return reply.status(409).send(Errors.usernameAlreadyExists().toJSON());
      }
      if (target === 'slug') {
        return reply.status(409).send(Errors.slugAlreadyExists().toJSON());
      }
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return reply.status(404).send({
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'Record not found',
        },
      });
    }
  }

  // Default internal error
  return reply.status(500).send({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An internal error occurred',
    },
  });
}

