import type { PrismaClient, OAuthProvider as PrismaOAuthProvider } from '@prisma/client';
import type Redis from 'ioredis';
import crypto from 'crypto';

import type { OAuthProvider, OAuthUserInfo, User } from '@bastionauth/core';
import { SESSION_CONFIG, TOKEN_CONFIG } from '@bastionauth/core';

import { env } from '../config/env.js';
import { Errors } from '../lib/errors.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/tokens.js';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

interface RequestContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  country?: string;
  city?: string;
}

const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID || '',
    clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['email', 'profile', 'openid'],
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID || '',
    clientSecret: env.GITHUB_CLIENT_SECRET || '',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['user:email', 'read:user'],
  },
  microsoft: {
    clientId: env.MICROSOFT_CLIENT_ID || '',
    clientSecret: env.MICROSOFT_CLIENT_SECRET || '',
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'email', 'profile'],
  },
  apple: {
    clientId: env.APPLE_CLIENT_ID || '',
    clientSecret: env.APPLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: '', // Apple uses ID token, no userinfo endpoint
    scopes: ['email', 'name'],
  },
  linkedin: {
    clientId: env.LINKEDIN_CLIENT_ID || '',
    clientSecret: env.LINKEDIN_CLIENT_SECRET || '',
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    scopes: ['openid', 'profile', 'email'],
  },
};

export class OAuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: OAuthProvider): boolean {
    const config = OAUTH_CONFIGS[provider];
    return !!(config.clientId && config.clientSecret);
  }

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<{ redirectUrl: string; state: string }> {
    if (!this.isProviderConfigured(provider)) {
      throw Errors.oauthError(`${provider} OAuth is not configured`);
    }

    const config = OAUTH_CONFIGS[provider];
    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store state and code verifier in Redis
    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify({ provider, codeVerifier, redirectUri }),
      'EX',
      600 // 10 minutes
    );

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      ...(provider !== 'apple' && { code_challenge: codeChallenge }),
      ...(provider !== 'apple' && { code_challenge_method: 'S256' }),
    });

    return {
      redirectUrl: `${config.authorizeUrl}?${params.toString()}`,
      state,
    };
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(
    code: string,
    state: string,
    context: RequestContext
  ): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    isNewUser: boolean;
  }> {
    // Retrieve and validate state
    const stateData = await this.redis.get(`oauth:state:${state}`);
    if (!stateData) {
      throw Errors.oauthStateMismatch();
    }

    const { provider, codeVerifier, redirectUri } = JSON.parse(stateData);
    await this.redis.del(`oauth:state:${state}`);

    const _config = OAUTH_CONFIGS[provider]; // Validates provider exists

    // Exchange code for tokens
    const tokenResponse = await this.exchangeCode(
      provider,
      code,
      redirectUri,
      codeVerifier
    );

    // Get user info from provider
    const userInfo = await this.getUserInfo(
      provider,
      tokenResponse.access_token,
      tokenResponse.id_token
    );

    // Find or create user
    const { user, isNewUser } = await this.findOrCreateUser(
      userInfo,
      tokenResponse.access_token,
      tokenResponse.refresh_token
    );

    // Create session
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.DEFAULT_EXPIRY_SECONDS * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint,
        country: context.country,
        city: context.city,
        expiresAt,
      },
    });

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS,
      },
      isNewUser,
    };
  }

  /**
   * Link OAuth account to existing user
   */
  async linkAccount(
    userId: string,
    provider: OAuthProvider,
    code: string,
    redirectUri: string
  ): Promise<void> {
    const _config = OAUTH_CONFIGS[provider]; // Validates provider exists

    // Exchange code for tokens
    const tokenResponse = await this.exchangeCode(provider, code, redirectUri);

    // Get user info
    const userInfo = await this.getUserInfo(
      provider,
      tokenResponse.access_token,
      tokenResponse.id_token
    );

    // Check if account already linked
    const existing = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider.toUpperCase() as PrismaOAuthProvider,
          providerAccountId: userInfo.providerAccountId,
        },
      },
    });

    if (existing) {
      if (existing.userId === userId) {
        return; // Already linked to this user
      }
      throw Errors.oauthAccountExists();
    }

    // Create OAuth account
    await this.prisma.oAuthAccount.create({
      data: {
        userId,
        provider: provider.toUpperCase() as PrismaOAuthProvider,
        providerAccountId: userInfo.providerAccountId,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        accessTokenExpiresAt: tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000)
          : null,
      },
    });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async exchangeCode(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
  }> {
    const config = OAUTH_CONFIGS[provider];

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OAuth token exchange failed:', error);
      throw Errors.oauthError('Failed to exchange code for token');
    }

    return response.json();
  }

  private async getUserInfo(
    provider: OAuthProvider,
    accessToken: string,
    idToken?: string
  ): Promise<OAuthUserInfo> {
    const config = OAUTH_CONFIGS[provider];

    // Apple uses ID token
    if (provider === 'apple' && idToken) {
      return this.parseAppleIdToken(idToken);
    }

    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw Errors.oauthError('Failed to get user info');
    }

    const data = await response.json();
    return this.normalizeUserInfo(provider, data, accessToken);
  }

  private normalizeUserInfo(
    provider: OAuthProvider,
    data: Record<string, unknown>,
    accessToken: string
  ): OAuthUserInfo {
    switch (provider) {
      case 'google':
        return {
          provider,
          providerAccountId: data.id as string,
          email: data.email as string,
          name: data.name as string,
          firstName: (data.given_name as string) || undefined,
          lastName: (data.family_name as string) || undefined,
          avatarUrl: data.picture as string,
          accessToken,
        };

      case 'github':
        return {
          provider,
          providerAccountId: String(data.id),
          email: data.email as string,
          name: data.name as string,
          avatarUrl: data.avatar_url as string,
          accessToken,
        };

      case 'microsoft':
        return {
          provider,
          providerAccountId: data.id as string,
          email: (data.mail || data.userPrincipalName) as string,
          name: data.displayName as string,
          firstName: (data.givenName as string) || undefined,
          lastName: (data.surname as string) || undefined,
          accessToken,
        };

      case 'linkedin':
        return {
          provider,
          providerAccountId: data.sub as string,
          email: data.email as string,
          name: data.name as string,
          firstName: (data.given_name as string) || undefined,
          lastName: (data.family_name as string) || undefined,
          avatarUrl: data.picture as string,
          accessToken,
        };

      default:
        throw Errors.oauthError(`Unknown provider: ${provider}`);
    }
  }

  private parseAppleIdToken(idToken: string): OAuthUserInfo {
    const [, payloadB64] = idToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    return {
      provider: 'apple',
      providerAccountId: payload.sub,
      email: payload.email,
      accessToken: idToken,
    };
  }

  private async findOrCreateUser(
    userInfo: OAuthUserInfo,
    accessToken: string,
    refreshToken?: string
  ): Promise<{ user: { id: string; email: string; emailVerified: boolean; firstName: string | null; lastName: string | null; username: string | null; imageUrl: string | null; mfaEnabled: boolean; publicMetadata: unknown; unsafeMetadata: unknown; createdAt: Date; updatedAt: Date; lastSignInAt: Date | null }; isNewUser: boolean }> {
    // Check if OAuth account exists
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: userInfo.provider.toUpperCase() as PrismaOAuthProvider,
          providerAccountId: userInfo.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      // Update OAuth tokens
      await this.prisma.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken,
          refreshToken,
          accessTokenExpiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Update user last sign in
      await this.prisma.user.update({
        where: { id: existingAccount.user.id },
        data: { lastSignInAt: new Date() },
      });

      return { user: existingAccount.user, isNewUser: false };
    }

    // Check if user exists by email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (existingUser) {
      // Link OAuth account to existing user
      await this.prisma.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: userInfo.provider.toUpperCase() as PrismaOAuthProvider,
          providerAccountId: userInfo.providerAccountId,
          email: userInfo.email,
          name: userInfo.name,
          avatarUrl: userInfo.avatarUrl,
          accessToken,
          refreshToken,
        },
      });

      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { lastSignInAt: new Date() },
      });

      return { user: existingUser, isNewUser: false };
    }

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email: userInfo.email,
        emailVerified: true, // OAuth emails are verified
        firstName: userInfo.firstName || null,
        lastName: userInfo.lastName || null,
        imageUrl: userInfo.avatarUrl || null,
        lastSignInAt: new Date(),
        oauthAccounts: {
          create: {
            provider: userInfo.provider.toUpperCase() as PrismaOAuthProvider,
            providerAccountId: userInfo.providerAccountId,
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.avatarUrl,
            accessToken,
            refreshToken,
          },
        },
      },
    });

    return { user, isNewUser: true };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    emailVerified: boolean;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    imageUrl: string | null;
    mfaEnabled: boolean;
    publicMetadata: unknown;
    unsafeMetadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt: Date | null;
  }): User {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      mfaEnabled: user.mfaEnabled,
      publicMetadata: user.publicMetadata as Record<string, unknown>,
      unsafeMetadata: user.unsafeMetadata as Record<string, unknown>,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignInAt: user.lastSignInAt,
    };
  }
}

