import { test, expect } from '@playwright/test';

test.describe('Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.describe('Create Organization', () => {
    test('should display create organization form', async ({ page }) => {
      await page.goto('/organizations/new');
      
      await expect(page.getByRole('heading', { name: /create organization/i })).toBeVisible();
      await expect(page.getByLabel(/organization name/i)).toBeVisible();
    });

    test('should create organization successfully', async ({ page }) => {
      await page.goto('/organizations/new');
      
      await page.getByLabel(/organization name/i).fill('Test Organization');
      await page.getByRole('button', { name: /create/i }).click();
      
      await expect(page).toHaveURL(/\/organizations\/[\w-]+/);
      await expect(page.getByText(/test organization/i)).toBeVisible();
    });

    test('should generate slug from name', async ({ page }) => {
      await page.goto('/organizations/new');
      
      await page.getByLabel(/organization name/i).fill('My Cool Org!');
      
      // Slug preview should show generated slug
      await expect(page.getByText(/my-cool-org/i)).toBeVisible();
    });
  });

  test.describe('View Organization', () => {
    test('should display organization details', async ({ page }) => {
      await page.goto('/organizations');
      
      // Click on first organization
      await page.getByRole('link', { name: /test organization/i }).first().click();
      
      await expect(page.getByRole('heading', { name: /test organization/i })).toBeVisible();
      await expect(page.getByText(/members/i)).toBeVisible();
    });
  });

  test.describe('Invite Members', () => {
    test('should show invite member form', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /members/i }).click();
      await page.getByRole('button', { name: /invite member/i }).click();
      
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/role/i)).toBeVisible();
    });

    test('should send invitation', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /members/i }).click();
      await page.getByRole('button', { name: /invite member/i }).click();
      
      await page.getByLabel(/email/i).fill('invite@example.com');
      await page.getByLabel(/role/i).selectOption('member');
      await page.getByRole('button', { name: /send invitation/i }).click();
      
      await expect(page.getByText(/invitation sent/i)).toBeVisible();
    });

    test('should show pending invitations', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /members/i }).click();
      
      await expect(page.getByText(/pending invitations/i)).toBeVisible();
    });
  });

  test.describe('Manage Members', () => {
    test('should display member list', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /members/i }).click();
      
      await expect(page.locator('table')).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /member/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible();
    });

    test('should allow changing member role', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /members/i }).click();
      
      // Click on role dropdown for a member
      await page.getByRole('button', { name: /change role/i }).first().click();
      await page.getByRole('option', { name: /admin/i }).click();
      
      await expect(page.getByText(/role updated/i)).toBeVisible();
    });

    test('should allow removing member', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /members/i }).click();
      
      await page.getByRole('button', { name: /remove/i }).first().click();
      
      // Confirm dialog
      await page.getByRole('button', { name: /confirm/i }).click();
      
      await expect(page.getByText(/member removed/i)).toBeVisible();
    });
  });

  test.describe('Organization Settings', () => {
    test('should display organization settings', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
      await expect(page.getByLabel(/organization name/i)).toBeVisible();
    });

    test('should update organization name', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByLabel(/organization name/i).fill('Updated Org Name');
      await page.getByRole('button', { name: /save/i }).click();
      
      await expect(page.getByText(/settings saved/i)).toBeVisible();
    });

    test('should show delete organization option', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');
      
      await page.getByRole('tab', { name: /danger/i }).click();
      
      await expect(page.getByRole('button', { name: /delete organization/i })).toBeVisible();
    });
  });
});

