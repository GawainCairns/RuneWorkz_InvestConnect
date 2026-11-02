import { expect, test } from '@playwright/test';
import { adminProfile, loginAs, mockBackend, userProfile } from './helpers';

test.describe('Unauthenticated access', () => {
  for (const path of ['/profile', '/invitee-dashboard', '/admin', '/admin/events', '/admin/emails']) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await mockBackend(page);
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe('Authenticated non-admin', () => {
  test('is redirected away from /admin to /invitee-dashboard', async ({ page }) => {
    await loginAs(page, userProfile);
    await page.goto('/admin/events');
    await expect(page).toHaveURL(/\/invitee-dashboard/);
  });

  test('/ redirects to /invitee-dashboard', async ({ page }) => {
    await loginAs(page, userProfile);
    await page.goto('/');
    await expect(page).toHaveURL(/\/invitee-dashboard/);
  });
});

test.describe('Authenticated admin', () => {
  test('/ redirects to /admin', async ({ page }) => {
    await loginAs(page, adminProfile);
    await page.goto('/');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('can open the admin event list', async ({ page }) => {
    await loginAs(page, adminProfile);
    await page.goto('/admin/events');
    await expect(page).toHaveURL(/\/admin\/events$/);
  });

  test('visiting /login while signed in redirects away from login', async ({ page }) => {
    await loginAs(page, adminProfile);
    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login$/);
  });
});

test.describe('Session handling', () => {
  test('an invalid stored token is cleared and the user is sent to /login', async ({ page }) => {
    await page.route('**/*', route => {
      const req = route.request();
      if (req.resourceType() === 'fetch' && new URL(req.url()).pathname.endsWith('/validate')) {
        return route.fulfill({ status: 401, json: { message: 'invalid' } });
      }
      return route.fallback();
    });
    await page.addInitScript(() => localStorage.setItem('investconnect_token', 'expired'));
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('investconnect_token'))).toBeNull();
  });
});
