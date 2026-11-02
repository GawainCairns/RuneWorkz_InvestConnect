import { expect, test } from '@playwright/test';
import { adminProfile, mockBackend, TOKEN_KEY, userProfile } from './helpers';

test.describe('Login', () => {
  test('shows the login form @smoke', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create one' })).toBeVisible();
  });

  test('requires email and password', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Email address')).toHaveJSProperty('validity.valueMissing', true);
  });

  test('password visibility can be toggled', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');
    const password = page.getByLabel('Password');
    await password.fill('secret123');
    await expect(password).toHaveAttribute('type', 'password');
    await page.locator('#password ~ button').click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('shows an error alert for invalid credentials', async ({ page }) => {
    await mockBackend(page, { loginError: 'Invalid credentials' });
    await page.goto('/login');
    await page.getByLabel('Email address').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('admin lands on /admin and token is stored', async ({ page }) => {
    await mockBackend(page, { profile: adminProfile });
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin/);
    expect(await page.evaluate(k => localStorage.getItem(k), TOKEN_KEY)).toBe('fake-token');
  });

  test('regular user lands on /invitee-dashboard', async ({ page }) => {
    await mockBackend(page, { profile: userProfile });
    await page.goto('/login');
    await page.getByLabel('Email address').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/invitee-dashboard/);
  });
});

test.describe('Register', () => {
  test('shows the registration form @smoke', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.locator('#firstname')).toBeVisible();
    await expect(page.locator('#lastname')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toHaveAttribute('minlength', '6');
  });

  test('rejects a password shorter than 6 characters', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/register');
    await page.locator('#firstname').fill('Jane');
    await page.locator('#lastname').fill('Doe');
    await page.locator('#email').fill('jane@example.com');
    await page.locator('#password').fill('123');
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
});

test.describe('Forgot password', () => {
  test('sends a reset link and shows the confirmation', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
    await page.getByLabel('Email address').fill('user@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('a reset link was sent', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to sign in' }).first()).toBeVisible();
  });
});

test.describe('Navigation between auth pages', () => {
  test('login -> forgot password and login -> register', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
});
