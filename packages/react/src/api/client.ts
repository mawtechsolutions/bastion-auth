import type {
  Organization,
  Session,
  SignInRequest,
  SignUpRequest,
  User,
} from '@bastionauth/core';

export interface BastionClientConfig {
  publishableKey: string;
  apiUrl?: string;
}

interface AuthResult {
  user: User;
  session: { id: string; expiresAt: string };
  tokens: { accessToken: string; expiresIn: number };
}

interface MfaRequiredResult {
  requiresMfa: true;
  mfaChallengeId: string;
  supportedMethods: ('totp' | 'backup_code')[];
}

export class BastionClient {
  private apiUrl: string;
  private accessToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: BastionClientConfig) {
    this.apiUrl = config.apiUrl || 'https://api.bastionauth.dev';
    // Try to load token from cookie on initialization
    if (typeof document !== 'undefined') {
      this.accessToken = this.getSessionCookie();
    }
  }

  /**
   * Set the access token and store in cookie for SSR
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
    this.setSessionCookie(token);
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Store session token in cookie for middleware access
   */
  private setSessionCookie(token: string | null) {
    if (typeof document === 'undefined') return;
    
    if (token) {
      // Set cookie with SameSite=Lax to be accessible on navigation
      document.cookie = `__session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      // Clear the cookie
      document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  /**
   * Get session token from cookie
   */
  private getSessionCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '__session' && value) {
        return value;
      }
    }
    return null;
  }

  /**
   * Make an authenticated request
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.accessToken) {
      await this.refreshAccessToken();

      // Retry the request with new token
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      const retryResponse = await fetch(`${this.apiUrl}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        throw await this.parseError(retryResponse);
      }

      return retryResponse.json();
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    return response.json();
  }

  private async parseError(response: Response): Promise<Error> {
    try {
      const data = await response.json();
      const error = new Error(data.error?.message || 'An error occurred');
      (error as Error & { code?: string }).code = data.error?.code;
      return error;
    } catch {
      return new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<void> {
    // Deduplicate concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.apiUrl}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({}), // Send empty body to satisfy Fastify JSON parser
        });

        if (!response.ok) {
          this.setAccessToken(null);
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setAccessToken(data.accessToken);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ============================================
  // AUTH METHODS
  // ============================================

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<AuthResult> {
    const result = await this.request<AuthResult>('/api/v1/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setAccessToken(result.tokens.accessToken);
    return result;
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInRequest): Promise<AuthResult | MfaRequiredResult> {
    const result = await this.request<AuthResult | MfaRequiredResult>(
      '/api/v1/auth/sign-in',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if ('tokens' in result) {
      this.setAccessToken(result.tokens.accessToken);
    }

    return result;
  }

  /**
   * Verify MFA code
   */
  async verifyMfa(
    mfaChallengeId: string,
    code: string,
    method: 'totp' | 'backup_code'
  ): Promise<AuthResult> {
    const result = await this.request<AuthResult>('/api/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ mfaChallengeId, code, method }),
    });

    this.setAccessToken(result.tokens.accessToken);
    return result;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await this.request('/api/v1/auth/sign-out', { 
      method: 'POST',
      body: JSON.stringify({}), // Send empty body to satisfy Fastify JSON parser
    });
    this.setAccessToken(null);
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{
    user: User | null;
    session: Session | null;
  }> {
    try {
      // First try to refresh the token
      await this.refreshAccessToken();

      // Then get user data
      const user = await this.request<User>('/api/v1/users/me');

      return {
        user,
        session: null, // Session details are in the token
      };
    } catch {
      return { user: null, session: null };
    }
  }

  /**
   * Get token for server-side use
   */
  async getToken(): Promise<string | null> {
    if (!this.accessToken) {
      try {
        await this.refreshAccessToken();
      } catch {
        return null;
      }
    }
    return this.accessToken;
  }

  // ============================================
  // USER METHODS
  // ============================================

  /**
   * Get current user
   */
  async getUser(): Promise<User> {
    return this.request<User>('/api/v1/users/me');
  }

  /**
   * Update current user
   */
  async updateUser(data: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // ORGANIZATION METHODS
  // ============================================

  /**
   * Get organization by ID or slug
   */
  async getOrganization(idOrSlug: string): Promise<Organization> {
    return this.request<Organization>(`/api/v1/organizations/${idOrSlug}`);
  }

  /**
   * Get user's organizations
   */
  async getOrganizations(): Promise<{ organizations: Organization[] }> {
    return this.request<{ organizations: Organization[] }>('/api/v1/organizations');
  }

  // ============================================
  // OAUTH METHODS
  // ============================================

  /**
   * Get OAuth redirect URL
   */
  getOAuthUrl(provider: string): string {
    return `${this.apiUrl}/api/v1/auth/oauth/${provider}`;
  }
}

