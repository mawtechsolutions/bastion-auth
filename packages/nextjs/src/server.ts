import { cookies, headers } from 'next/headers';

import type { User } from '@bastionauth/core';

/**
 * Auth object returned by auth()
 */
export interface AuthObject {
  userId: string | null;
  sessionId: string | null;
  orgId: string | null;
  orgRole: string | null;
  getToken: () => Promise<string | null>;
}

interface TokenPayload {
  sub: string;
  sessionId: string;
  orgId?: string;
  orgRole?: string;
  exp: number;
}

/**
 * Parse JWT token
 */
function parseToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get auth object from the current request
 *
 * @example
 * // app/api/example/route.ts
 * import { auth } from '@bastionauth/nextjs/server';
 *
 * export async function GET() {
 *   const { userId } = await auth();
 *
 *   if (!userId) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *
 *   return Response.json({ userId });
 * }
 */
export async function auth(): Promise<AuthObject> {
  const cookieStore = await cookies();
  const headerList = await headers();

  // Try to get token from cookie first, then header
  const sessionCookie = cookieStore.get('__session')?.value;
  const authHeader = headerList.get('authorization');
  const token = sessionCookie || authHeader?.replace('Bearer ', '');

  if (!token) {
    return {
      userId: null,
      sessionId: null,
      orgId: null,
      orgRole: null,
      getToken: async () => null,
    };
  }

  const payload = parseToken(token);

  if (!payload) {
    return {
      userId: null,
      sessionId: null,
      orgId: null,
      orgRole: null,
      getToken: async () => null,
    };
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return {
      userId: null,
      sessionId: null,
      orgId: null,
      orgRole: null,
      getToken: async () => null,
    };
  }

  return {
    userId: payload.sub,
    sessionId: payload.sessionId,
    orgId: payload.orgId ?? null,
    orgRole: payload.orgRole ?? null,
    getToken: async () => token,
  };
}

/**
 * Get the current user
 *
 * @example
 * // app/page.tsx
 * import { currentUser } from '@bastionauth/nextjs/server';
 *
 * export default async function Page() {
 *   const user = await currentUser();
 *
 *   if (!user) {
 *     return <div>Not signed in</div>;
 *   }
 *
 *   return <div>Hello, {user.firstName}!</div>;
 * }
 */
export async function currentUser(): Promise<User | null> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  const token = await getToken();

  if (!token) {
    return null;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'https://api.bastionauth.dev';

    const response = await fetch(`${apiUrl}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

/**
 * Protect a server action or route handler
 *
 * @example
 * // app/api/protected/route.ts
 * import { requireAuth } from '@bastionauth/nextjs/server';
 *
 * export async function GET() {
 *   const { userId } = await requireAuth();
 *   // userId is guaranteed to be a string here
 *   return Response.json({ userId });
 * }
 */
export async function requireAuth(): Promise<{ userId: string; sessionId: string }> {
  const { userId, sessionId } = await auth();

  if (!userId || !sessionId) {
    throw new Error('Unauthorized');
  }

  return { userId, sessionId };
}

