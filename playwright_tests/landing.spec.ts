import { expect, test } from '@playwright/test';
import { mockBackend } from './helpers';

test.beforeEach(async ({ page }) => mockBackend(page));

test.describe('Landing page @smoke', () => {
  test('renders hero and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('InvestConnect').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('Sign In navigates to /login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Get Started navigates to /register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('unknown routes redirect to the landing page', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page).toHaveURL(/\/$/);
  });
});
