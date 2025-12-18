import { test, expect } from '@playwright/test';

test.describe('MFA Flow', () => {
  test.describe('MFA Setup', () => {
    test('should show MFA setup option in settings', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.goto('/settings');
      
      await expect(page.getByText(/two-factor authentication/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /enable mfa/i })).toBeVisible();
    });

    test('should display QR code when setting up MFA', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.goto('/settings');
      await page.getByRole('button', { name: /enable mfa/i }).click();
      
      await expect(page.getByRole('img', { name: /qr code/i })).toBeVisible();
      await expect(page.getByText(/scan this qr code/i)).toBeVisible();
    });

    test('should show backup codes after MFA setup', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.goto('/settings');
      await page.getByRole('button', { name: /enable mfa/i }).click();
      
      // Enter valid TOTP code
      await page.getByLabel(/verification code/i).fill('123456');
      await page.getByRole('button', { name: /verify/i }).click();
      
      // Should show backup codes
      await expect(page.getByText(/backup codes/i)).toBeVisible();
    });
  });

  test.describe('MFA Sign In', () => {
    test('should prompt for TOTP code after password', async ({ page }) => {
      await page.goto('/sign-in');
      
      await page.getByLabel(/email/i).fill('mfa-user@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show MFA verification screen
      await expect(page.getByText(/two-factor authentication/i)).toBeVisible();
      await expect(page.getByLabel(/verification code/i)).toBeVisible();
    });

    test('should show error for invalid TOTP code', async ({ page }) => {
      await page.goto('/sign-in');
      
      await page.getByLabel(/email/i).fill('mfa-user@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.getByLabel(/verification code/i).fill('000000');
      await page.getByRole('button', { name: /verify/i }).click();
      
      await expect(page.getByText(/invalid code/i)).toBeVisible();
    });

    test('should allow use of backup code', async ({ page }) => {
      await page.goto('/sign-in');
      
      await page.getByLabel(/email/i).fill('mfa-user@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.getByRole('link', { name: /use backup code/i }).click();
      
      await expect(page.getByLabel(/backup code/i)).toBeVisible();
    });
  });

  test.describe('MFA Disable', () => {
    test('should require password to disable MFA', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.getByLabel(/email/i).fill('mfa-user@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Enter MFA code
      await page.getByLabel(/verification code/i).fill('123456');
      await page.getByRole('button', { name: /verify/i }).click();
      
      await page.goto('/settings');
      await page.getByRole('button', { name: /disable mfa/i }).click();
      
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });
  });
});

