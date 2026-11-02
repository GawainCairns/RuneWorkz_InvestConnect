import { expect, test } from '@playwright/test';

// Read-only checks without mocks. Run against production with:
//   $env:BASE_URL='https://investconnect.magicrunez.com'; npx playwright test --grep @smoke playwright_tests/smoke.live.spec.ts
test.describe('Live smoke @smoke', () => {
  test('landing page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('protected route redirects anonymous users to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });
});
