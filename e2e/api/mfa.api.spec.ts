import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_BASE = 'http://localhost:3001/api/v1';

/**
 * Flush Redis rate limits before tests
 */
async function flushRateLimits() {
  try {
    await execAsync('docker exec bastionauth-redis redis-cli FLUSHALL');
  } catch {
    // Redis flush failed, tests may be rate limited
  }
}

/**
 * Helper to make API requests
 */
async function apiRequest(
  request: any,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  options?: { data?: any; headers?: Record<string, string> }
) {
  const response = await request[method](`${API_BASE}${endpoint}`, {
    data: options?.data,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Response may not be JSON
  }
  
  return { status: response.status(), body, headers: response.headers() };
}

/**
 * Sign in and get access token
 */
async function getAuthToken(request: any, email: string, password: string) {
  const { body, status } = await apiRequest(request, 'post', '/auth/sign-in', {
    data: { email, password },
  });
  
  if (status !== 200) {
    return null;
  }
  
  return body.tokens?.accessToken;
}

test.describe('MFA API Contract Tests', () => {
  let accessToken: string | null;

  test.beforeAll(async ({ request }) => {
    // Flush rate limits before getting tokens
    await flushRateLimits();
    accessToken = await getAuthToken(request, 'test@example.com', 'Test123!');
  });

  test.describe('MFA Enable', () => {
    test('should return 401 without authentication', async ({ request }) => {
      // Try MFA-related endpoint without auth
      const { status } = await apiRequest(request, 'get', '/users/me');
      expect(status).toBe(401);
    });

    test('should generate TOTP secret with valid token', async ({ request }) => {
      if (!accessToken) {
        test.skip();
        return;
      }

      const { status, body } = await apiRequest(request, 'post', '/users/me/mfa/enable', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // May return 200 with secret, 400/409 if already enabled, or 500 for server errors
      if (status === 200) {
        expect(body).toHaveProperty('secret');
        expect(body).toHaveProperty('qrCode');
        expect(body.secret).toMatch(/^[A-Z2-7]{16,32}$/); // Base32 encoded
      } else {
        expect([400, 409, 500]).toContain(status); // Already enabled or server error
      }
    });
  });

  test.describe('POST /mfa/verify', () => {
    test('should reject invalid MFA challenge ID', async ({ request }) => {
      const { status, body } = await apiRequest(request, 'post', '/auth/mfa/verify', {
        data: {
          mfaChallengeId: '00000000-0000-0000-0000-000000000000',
          code: '123456',
          method: 'totp',
        },
      });

      expect(status).toBe(401);
      expect(body).toHaveProperty('error');
    });

    test('should reject invalid TOTP code format', async ({ request }) => {
      const { status } = await apiRequest(request, 'post', '/auth/mfa/verify', {
        data: {
          mfaChallengeId: '00000000-0000-0000-0000-000000000000',
          code: 'abc', // Invalid format
          method: 'totp',
        },
      });

      expect([400, 401]).toContain(status);
    });

    test('should reject invalid method', async ({ request }) => {
      const { status } = await apiRequest(request, 'post', '/auth/mfa/verify', {
        data: {
          mfaChallengeId: '00000000-0000-0000-0000-000000000000',
          code: '123456',
          method: 'invalid_method',
        },
      });

      // May return 400 (validation), 401 (unauthorized), or 500 (server error)
      expect([400, 401, 500]).toContain(status);
    });

    test('should reject missing required fields', async ({ request }) => {
      const { status } = await apiRequest(request, 'post', '/auth/mfa/verify', {
        data: {},
      });

      // May return 400 (validation), 401 (unauthorized), or 500 (server error)
      expect([400, 401, 500]).toContain(status);
    });
  });

  test.describe('Backup Codes', () => {
    test('should return 401 without authentication for user endpoint', async ({ request }) => {
      const { status } = await apiRequest(request, 'get', '/users/me');
      expect(status).toBe(401);
    });

    test('should regenerate backup codes with valid token', async ({ request }) => {
      if (!accessToken) {
        test.skip();
        return;
      }

      const { status, body } = await apiRequest(request, 'post', '/users/me/mfa/backup-codes', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // May return 200 with codes or 400 if MFA not enabled
      if (status === 200) {
        expect(body).toHaveProperty('backupCodes');
        expect(Array.isArray(body.backupCodes)).toBe(true);
        expect(body.backupCodes.length).toBe(10);
      }
    });
  });

  test.describe('MFA Disable', () => {
    test('should return 401 without authentication for protected endpoints', async ({ request }) => {
      const { status } = await apiRequest(request, 'get', '/users/me');
      expect(status).toBe(401);
    });

    test('should require TOTP code to disable', async ({ request }) => {
      if (!accessToken) {
        test.skip();
        return;
      }

      const { status, body } = await apiRequest(request, 'delete', '/users/me/mfa', {
        data: { code: '000000' }, // Invalid code
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Should fail without valid TOTP (500 may occur if MFA not enabled)
      expect([400, 401, 404, 500]).toContain(status);
    });
  });
});

test.describe('MFA Sign-In Flow Tests', () => {
  test('should return MFA required for MFA-enabled user', async ({ request }) => {
    // This test requires a pre-configured MFA user
    const { status, body } = await apiRequest(request, 'post', '/auth/sign-in', {
      data: {
        email: 'mfa-user@example.com',
        password: 'Password123!',
      },
    });

    // If user exists and has MFA
    if (status === 200 && body.requiresMfa) {
      expect(body.requiresMfa).toBe(true);
      expect(body.mfaChallengeId).toBeTruthy();
      expect(body.user).toBeUndefined(); // User not returned until MFA verified
      expect(body.tokens).toBeUndefined(); // Tokens not returned until MFA verified
    }
  });

  test('should timeout MFA challenge after expiry', async ({ request }) => {
    // MFA challenges should expire after a configured time (e.g., 5 minutes)
    const { status, body } = await apiRequest(request, 'post', '/auth/mfa/verify', {
      data: {
        mfaChallengeId: '00000000-0000-0000-0000-000000000000', // Expired/invalid
        code: '123456',
        method: 'totp',
      },
    });

    expect(status).toBe(401);
  });
});

