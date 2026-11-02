import type { Page } from '@playwright/test';

export const TOKEN_KEY = 'investconnect_token';

const baseProfile = {
  user: {
    id: 1,
    email: 'test@example.com',
    active: 1,
    avatar: null,
    lastname: 'Tester',
    username: 'tester',
    firstname: 'Test',
    tenant_id: 'test-tenant',
    date_created: '2024-01-01T00:00:00Z',
  },
  properties: [],
  user_permissions: [],
};

export const adminProfile = {
  ...baseProfile,
  roles: [{ id: 1, name: 'admin', description: null, permissions: [] }],
};

export const userProfile = {
  ...baseProfile,
  roles: [{ id: 2, name: 'user', description: null, permissions: [] }],
};

type Profile = typeof adminProfile;

interface MockOptions {
  /** Profile returned for login/validate. */
  profile?: Profile;
  /** Make /login respond with a 401 and this message. */
  loginError?: string;
}

/**
 * Mocks the auth service (login/register/validate/forgot) and the InvestConnect API,
 * so tests never hit real services. Only fetch/XHR calls are intercepted so SPA page
 * navigations to /login etc. still reach the dev server.
 */
export async function mockBackend(page: Page, opts: MockOptions = {}) {
  const profile = opts.profile ?? userProfile;

  await page.route('**/*', async route => {
    const request = route.request();
    if (request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr') {
      return route.fallback();
    }
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/login')) {
      if (opts.loginError) {
        return route.fulfill({ status: 401, json: { message: opts.loginError } });
      }
      return route.fulfill({ json: { token: 'fake-token', profile } });
    }
    if (path.endsWith('/validate')) {
      return route.fulfill({ json: { token: 'fake-token', profile } });
    }
    if (path.endsWith('/register')) {
      return route.fulfill({ json: { token: 'fake-token', profile } });
    }
    if (path.endsWith('/forgot')) {
      return route.fulfill({ json: { message: 'If that account exists, a reset link was sent.' } });
    }
    if (path.includes('/investconnect')) {
      return route.fulfill({ json: [] });
    }
    return route.fallback();
  });
}

/** Simulates an already logged-in session (token in localStorage + mocked /validate). */
export async function loginAs(page: Page, profile: Profile) {
  await mockBackend(page, { profile });
  await page.addInitScript(key => localStorage.setItem(key, 'fake-token'), TOKEN_KEY);
}
