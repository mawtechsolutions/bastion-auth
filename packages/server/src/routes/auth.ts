import type { FastifyInstance } from 'fastify';

import {
  mfaVerifySchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { createAuditLog } from '../middleware/audit.js';
import {
  magicLinkRateLimit,
  passwordResetRateLimit,
  signInRateLimit,
  signUpRateLimit,
} from '../middleware/rateLimit.js';
import { AuthService, emailService, OAuthService } from '../services/index.js';
import { getClientIp, getGeoFromIp, generateDeviceFingerprint } from '../utils/fingerprint.js';
import { env } from '../config/env.js';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, fastify.redis);
  const oauthService = new OAuthService(fastify.prisma, fastify.redis);

  // ============================================
  // SIGN UP
  // ============================================
  fastify.post(
    '/sign-up',
    {
      preHandler: [signUpRateLimit],
      schema: {
        tags: ['Auth'],
        summary: 'Create a new account',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const data = signUpSchema.parse(request.body);
      const geo = await getGeoFromIp(getClientIp(request));

      const result = await authService.signUp(data, {
        ipAddress: getClientIp(request),
        userAgent: request.headers['user-agent'] || '',
        deviceFingerprint: generateDeviceFingerprint(request),
        country: geo.country || undefined,
        city: geo.city || undefined,
      });

      // Send verification email
      const { token } = await authService.requestEmailVerification(result.user.id);
      await emailService.sendVerificationEmail(result.user.email, token);

      // Create audit log
      await createAuditLog(request, {
        userId: result.user.id,
        action: 'user.sign_up',
        entityType: 'user',
        entityId: result.user.id,
      });

      // Set refresh token cookie
      reply.setCookie('refresh_token', result.tokens.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return reply.status(201).send({
        user: result.user,
        session: result.session,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        },
      });
    }
  );

  // ============================================
  // SIGN IN
  // ============================================
  fastify.post(
    '/sign-in',
    {
      preHandler: [signInRateLimit],
      schema: {
        tags: ['Auth'],
        summary: 'Sign in with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const data = signInSchema.parse(request.body);
      const geo = await getGeoFromIp(getClientIp(request));

      const result = await authService.signIn(data, {
        ipAddress: getClientIp(request),
        userAgent: request.headers['user-agent'] || '',
        deviceFingerprint: generateDeviceFingerprint(request),
        country: geo.country || undefined,
        city: geo.city || undefined,
      });

      // Handle MFA required
      if ('requiresMfa' in result) {
        return reply.send(result);
      }

      // Create audit log
      await createAuditLog(request, {
        userId: result.user.id,
        action: 'user.sign_in',
        entityType: 'session',
        entityId: result.session.id,
      });

      // Set refresh token cookie
      reply.setCookie('refresh_token', result.tokens.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.send({
        user: result.user,
        session: result.session,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        },
      });
    }
  );

  // ============================================
  // MFA VERIFY
  // ============================================
  fastify.post(
    '/mfa/verify',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Verify MFA code and complete sign in',
        body: {
          type: 'object',
          required: ['mfaChallengeId', 'code', 'method'],
          properties: {
            mfaChallengeId: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            method: { type: 'string', enum: ['totp', 'backup_code'] },
          },
        },
      },
    },
    async (request, reply) => {
      const data = mfaVerifySchema.parse(request.body);
      const geo = await getGeoFromIp(getClientIp(request));

      const result = await authService.verifyMfa(data.mfaChallengeId, data.code, data.method, {
        ipAddress: getClientIp(request),
        userAgent: request.headers['user-agent'] || '',
        deviceFingerprint: generateDeviceFingerprint(request),
        country: geo.country || undefined,
        city: geo.city || undefined,
      });

      // Create audit log
      await createAuditLog(request, {
        userId: result.user.id,
        action: 'user.sign_in_mfa',
        entityType: 'session',
        entityId: result.session.id,
        metadata: { method: data.method },
      });

      // Set refresh token cookie
      reply.setCookie('refresh_token', result.tokens.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.send({
        user: result.user,
        session: result.session,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        },
      });
    }
  );

  // ============================================
  // REFRESH TOKEN
  // ============================================
  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        body: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      // Get refresh token from body or cookie
      const refreshToken =
        (request.body as { refreshToken?: string })?.refreshToken ||
        request.cookies.refresh_token;

      if (!refreshToken) {
        throw Errors.invalidToken('No refresh token provided');
      }

      const geo = await getGeoFromIp(getClientIp(request));

      const tokens = await authService.refreshToken(refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: request.headers['user-agent'] || '',
        country: geo.country || undefined,
        city: geo.city || undefined,
      });

      // Set new refresh token cookie
      reply.setCookie('refresh_token', tokens.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.send({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
    }
  );

  // ============================================
  // SIGN OUT
  // ============================================
  fastify.post(
    '/sign-out',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Sign out current session',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      await authService.signOut(request.sessionId!);

      // Create audit log
      await createAuditLog(request, {
        action: 'user.sign_out',
        entityType: 'session',
        entityId: request.sessionId,
      });

      // Clear cookie
      reply.clearCookie('refresh_token', { path: '/' });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // SIGN OUT ALL
  // ============================================
  fastify.post(
    '/sign-out-all',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Sign out all sessions',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const count = await authService.signOutAll(request.userId!, request.sessionId);

      // Create audit log
      await createAuditLog(request, {
        action: 'user.sign_out_all',
        metadata: { revokedCount: count },
      });

      return reply.send({
        success: true,
        revokedSessions: count,
      });
    }
  );

  // ============================================
  // FORGOT PASSWORD
  // ============================================
  fastify.post(
    '/password/forgot',
    {
      preHandler: [passwordResetRateLimit],
      schema: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body as { email: string };

      const { token } = await authService.requestPasswordReset(email);

      // Only send email if user exists (token will be empty if not)
      if (token) {
        await emailService.sendPasswordResetEmail(email, token);
      }

      // Always return success to prevent email enumeration
      return reply.send({
        success: true,
        message: 'If an account exists, a reset link has been sent',
      });
    }
  );

  // ============================================
  // RESET PASSWORD
  // ============================================
  fastify.post(
    '/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        body: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const data = resetPasswordSchema.parse(request.body);

      await authService.resetPassword(data.token, data.password);

      // Create audit log (without userId since we don't have it from token)
      await createAuditLog(request, {
        action: 'password.reset',
      });

      return reply.send({ success: true });
    }
  );

  // ============================================
  // VERIFY EMAIL
  // ============================================
  fastify.post(
    '/email/verify',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Verify email with token',
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { token } = request.body as { token: string };

      const user = await authService.verifyEmail(token);

      // Create audit log
      await createAuditLog(request, {
        userId: user.id,
        action: 'email.verified',
        entityType: 'user',
        entityId: user.id,
      });

      return reply.send({
        success: true,
        user,
      });
    }
  );

  // ============================================
  // RESEND VERIFICATION EMAIL
  // ============================================
  fastify.post(
    '/email/resend',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Resend verification email',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.userId },
        select: { email: true, emailVerified: true },
      });

      if (!user) {
        throw Errors.userNotFound();
      }

      if (user.emailVerified) {
        return reply.send({
          success: true,
          message: 'Email is already verified',
        });
      }

      const { token } = await authService.requestEmailVerification(request.userId!);
      await emailService.sendVerificationEmail(user.email, token);

      return reply.send({ success: true });
    }
  );

  // ============================================
  // MAGIC LINK
  // ============================================
  fastify.post(
    '/magic-link',
    {
      preHandler: [magicLinkRateLimit],
      schema: {
        tags: ['Auth'],
        summary: 'Send magic link email',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            redirectUrl: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, redirectUrl } = request.body as { email: string; redirectUrl?: string };

      // Find or create user
      const user = await fastify.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true },
      });

      // Generate magic link token
      const { nanoid } = await import('nanoid');
      const token = nanoid(32);
      const tokenHash = (await import('../utils/crypto.js')).hashSha256(token);

      await fastify.prisma.magicLink.create({
        data: {
          userId: user?.id || null,
          email: email.toLowerCase(),
          tokenHash,
          redirectUrl,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });

      // Send email
      await emailService.sendMagicLinkEmail(email, token, redirectUrl);

      return reply.send({
        success: true,
        message: 'Magic link sent to email',
      });
    }
  );

  // ============================================
  // OAUTH - INITIATE
  // ============================================
  fastify.get(
    '/oauth/:provider',
    {
      schema: {
        tags: ['Auth', 'OAuth'],
        summary: 'Initiate OAuth flow',
        params: {
          type: 'object',
          required: ['provider'],
          properties: {
            provider: { type: 'string', enum: ['google', 'github', 'microsoft', 'apple', 'linkedin'] },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            redirect_uri: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { provider } = request.params as { provider: 'google' | 'github' | 'microsoft' | 'apple' | 'linkedin' };
      const { redirect_uri } = request.query as { redirect_uri?: string };

      // Check if provider is configured
      if (!oauthService.isProviderConfigured(provider)) {
        throw Errors.oauthProviderNotConfigured(provider);
      }

      const redirectUri = redirect_uri || `${env.API_URL}/api/v1/auth/oauth/${provider}/callback`;

      const { redirectUrl } = await oauthService.initiateOAuth(provider, redirectUri);

      return reply.redirect(redirectUrl);
    }
  );

  // ============================================
  // OAUTH - CALLBACK
  // ============================================
  fastify.get(
    '/oauth/:provider/callback',
    {
      schema: {
        tags: ['Auth', 'OAuth'],
        summary: 'OAuth callback handler',
        params: {
          type: 'object',
          required: ['provider'],
          properties: {
            provider: { type: 'string', enum: ['google', 'github', 'microsoft', 'apple', 'linkedin'] },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
            error: { type: 'string' },
            error_description: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { provider } = request.params as { provider: string };
      const { code, state, error, error_description } = request.query as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
      };

      // Handle OAuth error
      if (error) {
        const errorMessage = error_description || error;
        return reply.redirect(`${env.FRONTEND_URL}/sign-in?error=${encodeURIComponent(errorMessage)}`);
      }

      if (!code || !state) {
        return reply.redirect(`${env.FRONTEND_URL}/sign-in?error=missing_oauth_params`);
      }

      try {
        const geo = await getGeoFromIp(getClientIp(request));

        const result = await oauthService.handleCallback(code, state, {
          ipAddress: getClientIp(request),
          userAgent: request.headers['user-agent'] || '',
          deviceFingerprint: generateDeviceFingerprint(request),
          country: geo.country || undefined,
          city: geo.city || undefined,
        });

        // Create audit log
        await createAuditLog(request, {
          userId: result.user.id,
          action: result.isNewUser ? 'user.sign_up_oauth' : 'user.sign_in_oauth',
          entityType: 'user',
          entityId: result.user.id,
          metadata: { provider },
        });

        // Set refresh token cookie
        reply.setCookie('refresh_token', result.tokens.refreshToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });

        // Redirect to frontend with access token
        const successUrl = `${env.FRONTEND_URL}/oauth/callback?token=${result.tokens.accessToken}&expiresIn=${result.tokens.expiresIn}`;
        return reply.redirect(successUrl);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        return reply.redirect(`${env.FRONTEND_URL}/sign-in?error=${encodeURIComponent(err.message || 'oauth_failed')}`);
      }
    }
  );
}

