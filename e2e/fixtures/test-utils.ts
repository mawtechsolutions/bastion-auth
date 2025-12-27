import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user data
 */
export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Test fixtures
 */
export const test = base.extend<{
  testUser: TestUser;
  authenticatedPage: Page;
  adminPage: Page;
}>({
  // Generate a unique test user for each test
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: generateTestEmail(),
      password: 'SecureTestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };
    await use(user);
  },

  // Page with authenticated user
  authenticatedPage: async ({ page }, use) => {
    // Sign in with test credentials
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Test123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    await use(page);
  },

  // Page with admin user
  adminPage: async ({ page }, use) => {
    // Sign in with admin credentials
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill('admin@bastionauth.dev');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10000 });
    
    await use(page);
  },
});

export { expect };

/**
 * Sign in helper
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

/**
 * Sign up helper
 */
export async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto('/sign-up');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  if (user.firstName) {
    await page.getByLabel(/first name/i).fill(user.firstName);
  }
  if (user.lastName) {
    await page.getByLabel(/last name/i).fill(user.lastName);
  }
  await page.getByRole('button', { name: /sign up/i }).click();
}

/**
 * Sign out helper
 */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /sign out/i }).click();
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number }
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: options?.timeout || 10000 }
  );
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get form validation error
 */
export async function getValidationError(page: Page, fieldName: string): Promise<string | null> {
  const errorElement = page.locator(`[data-testid="${fieldName}-error"]`);
  if (await errorElement.isVisible()) {
    return await errorElement.textContent();
  }
  return null;
}

/**
 * API request helper for direct API testing
 */
export async function apiRequest(
  page: Page,
  method: string,
  endpoint: string,
  data?: unknown
): Promise<{ status: number; body: unknown }> {
  const response = await page.request[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
    `http://localhost:3001${endpoint}`,
    {
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return {
    status: response.status(),
    body: await response.json().catch(() => null),
  };
}

/**
 * Clear all cookies and storage
 */
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `e2e/screenshots/${name}-${timestamp}.png` });
}

