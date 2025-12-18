import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test.describe('Sign Up', () => {
    test('should display sign up page', async ({ page }) => {
      await page.goto('/sign-up');
      
      await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/sign-up');
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/sign-up');
      
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/sign-up');
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('123');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/password must be/i)).toBeVisible();
    });

    test('should successfully sign up with valid credentials', async ({ page }) => {
      await page.goto('/sign-up');
      
      const email = `test-${Date.now()}@example.com`;
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill('SecurePassword123!');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should redirect to verification page or dashboard
      await expect(page).toHaveURL(/\/(verify|dashboard)/);
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/sign-up');
      
      await page.getByLabel(/email/i).fill('existing@example.com');
      await page.getByLabel(/password/i).fill('SecurePassword123!');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/already exists/i)).toBeVisible();
    });
  });

  test.describe('Sign In', () => {
    test('should display sign in page', async ({ page }) => {
      await page.goto('/sign-in');
      
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/sign-in');
      
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('WrongPassword123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should successfully sign in with valid credentials', async ({ page }) => {
      await page.goto('/sign-in');
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should show OAuth provider buttons', async ({ page }) => {
      await page.goto('/sign-in');
      
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    });

    test('should have link to sign up page', async ({ page }) => {
      await page.goto('/sign-in');
      
      await page.getByRole('link', { name: /sign up/i }).click();
      
      await expect(page).toHaveURL(/\/sign-up/);
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/sign-in');
      
      await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to sign in', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('should allow authenticated users to access dashboard', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test('should sign out and redirect to home', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Sign out
      await page.getByRole('button', { name: /sign out/i }).click();
      
      await expect(page).toHaveURL('/');
    });

    test('should clear session after sign out', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Sign out
      await page.getByRole('button', { name: /sign out/i }).click();
      
      // Try to access protected route
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });
});

