import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test('should display forgot password page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: /forgot password/i }).click();
    
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should show success message after requesting reset', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should not reveal if email exists', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Even for non-existent email, should show success
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    // Should still show success to prevent email enumeration
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('should have link back to sign in', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.getByRole('link', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

