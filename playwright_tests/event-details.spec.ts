import { expect, test } from '@playwright/test';
import { adminProfile, loginAs } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAs(page, adminProfile);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem('copied-link', text);
        },
      },
    });
  });
  await page.route('**/*', async route => {
    const request = route.request();
    if (request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr') return route.fallback();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/brands')) return route.fulfill({ json: { brands: [] } });
    if (path.endsWith('/events')) return route.fulfill({ json: { events: [{
      id: 1, title: 'Test event', date: '2027-12-01', location: 'Test venue',
      price: 0, startTime: '09:00', endTime: '10:00',
    }] } });
    if (path.endsWith('/events/1')) return route.fulfill({ json: { event: {
      properties: [{ name: 'third_party_link', value: 'event code' }],
    } } });
    if (path.endsWith('/managers')) return route.fulfill({ json: { managers: [
      { id: 1, name: 'Alex Manager', email: 'alex@example.com', thirdPartyLink: 'manager code' },
      { id: 2, name: 'Sam Manager', email: 'sam@example.com', thirdPartyLink: '' },
    ] } });
    return route.fallback();
  });
});

test('event and manager registration links can be opened and copied', async ({ page }) => {
  await page.goto('/admin/events/1');
  const origin = new URL(page.url()).origin;
  const eventUrl = `${origin}/event/register/event%20code`;
  const managerUrl = `${origin}/event/reg/manager%20code`;

  await expect(page.getByRole('link', { name: eventUrl })).toHaveAttribute('href', eventUrl);
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByText('RSVP link copied')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('copied-link'))).toBe(eventUrl);

  await page.getByRole('button', { name: /Managers/ }).click();
  await expect(page.getByRole('link', { name: managerUrl })).toHaveAttribute('href', managerUrl);
  await expect(page.getByText('No link yet')).toBeVisible();
  await page.getByRole('button', { name: 'Copy registration link for Alex Manager' }).click();
  await expect(page.getByText('Manager link copied')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('copied-link'))).toBe(managerUrl);
});

test('copy failures are reported without claiming success', async ({ page }) => {
  await page.goto('/admin/events/1');
  await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Clipboard denied')) },
    });
  });
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByText('Could not copy the link. Please copy it manually.')).toBeVisible();
  await expect(page.getByText('RSVP link copied')).not.toBeVisible();
  await page.getByRole('button', { name: /Managers/ }).click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });
  await page.getByRole('button', { name: 'Copy registration link for Alex Manager' }).click();
  await expect(page.getByText('Could not copy the link. Please copy it manually.')).toHaveCount(2);
  await expect(page.getByText('Manager link copied')).not.toBeVisible();
});
