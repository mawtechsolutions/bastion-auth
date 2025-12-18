import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export interface AuthMiddlewareOptions {
  /**
   * Routes that don't require authentication
   */
  publicRoutes?: (string | RegExp)[];

  /**
   * Routes that are always ignored by the middleware
   */
  ignoredRoutes?: (string | RegExp)[];

  /**
   * URL to redirect to when not authenticated
   */
  signInUrl?: string;

  /**
   * URL to redirect to after signing in
   */
  afterSignInUrl?: string;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Custom logic to run before route matching
   */
  beforeAuth?: (req: NextRequest) => Promise<NextResponse | null> | NextResponse | null;

  /**
   * Custom logic to run after authentication check
   */
  afterAuth?: (
    auth: { userId: string | null; sessionId: string | null },
    req: NextRequest
  ) => Promise<NextResponse | null> | NextResponse | null;
}

const DEFAULT_PUBLIC_ROUTES = ['/sign-in', '/sign-up', '/sso-callback'];
const DEFAULT_IGNORED_ROUTES = [
  '/_next',
  '/api/webhooks',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * Checks if a path matches any of the provided patterns
 */
function matchesRoute(path: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      // Exact match or starts with (for path prefixes)
      return path === pattern || path.startsWith(pattern + '/');
    }
    return pattern.test(path);
  });
}

/**
 * Parse the JWT token to extract user ID and session ID
 */
function parseToken(token: string): { userId: string; sessionId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
    };
  } catch {
    return null;
  }
}

/**
 * Auth middleware for Next.js
 *
 * @example
 * // middleware.ts
 * import { authMiddleware } from '@bastionauth/nextjs';
 *
 * export default authMiddleware({
 *   publicRoutes: ['/'],
 * });
 *
 * export const config = {
 *   matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
 * };
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  const {
    publicRoutes = DEFAULT_PUBLIC_ROUTES,
    ignoredRoutes = DEFAULT_IGNORED_ROUTES,
    signInUrl = '/sign-in',
    debug = false,
    beforeAuth,
    afterAuth,
  } = options;

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Debug logging
    if (debug) {
      console.log(`[BastionAuth] Processing: ${pathname}`);
    }

    // Check if route should be ignored
    if (matchesRoute(pathname, ignoredRoutes)) {
      if (debug) {
        console.log(`[BastionAuth] Ignoring: ${pathname}`);
      }
      return NextResponse.next();
    }

    // Run beforeAuth hook
    if (beforeAuth) {
      const result = await beforeAuth(request);
      if (result) return result;
    }

    // Get auth token from cookies or Authorization header
    const authCookie = request.cookies.get('__session')?.value;
    const authHeader = request.headers.get('Authorization');
    const token = authCookie || authHeader?.replace('Bearer ', '');

    // Parse token to get user info
    const tokenData = token ? parseToken(token) : null;
    const userId = tokenData?.userId ?? null;
    const sessionId = tokenData?.sessionId ?? null;

    // Run afterAuth hook
    if (afterAuth) {
      const result = await afterAuth({ userId, sessionId }, request);
      if (result) return result;
    }

    // Check if route is public
    const isPublicRoute = matchesRoute(pathname, publicRoutes);

    if (debug) {
      console.log(`[BastionAuth] Route: ${pathname}, Public: ${isPublicRoute}, UserId: ${userId}`);
    }

    // If not authenticated and route is not public, redirect to sign-in
    if (!userId && !isPublicRoute) {
      const signInUrlObj = new URL(signInUrl, request.url);
      signInUrlObj.searchParams.set('redirect_url', pathname);

      if (debug) {
        console.log(`[BastionAuth] Redirecting to: ${signInUrlObj.toString()}`);
      }

      return NextResponse.redirect(signInUrlObj);
    }

    // If authenticated and on auth pages, redirect to home
    if (userId && (pathname === signInUrl || pathname === '/sign-up')) {
      const homeUrl = new URL('/', request.url);

      if (debug) {
        console.log(`[BastionAuth] User authenticated, redirecting to home`);
      }

      return NextResponse.redirect(homeUrl);
    }

    // Add auth headers to request
    const response = NextResponse.next();

    if (userId) {
      response.headers.set('x-bastion-user-id', userId);
    }

    if (sessionId) {
      response.headers.set('x-bastion-session-id', sessionId);
    }

    return response;
  };
}

export default authMiddleware;

