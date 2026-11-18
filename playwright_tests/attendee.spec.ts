import { expect, test } from '@playwright/test';
import { mockBackend } from './helpers';

test.describe('Attendee RSVP routes', () => {
  test.beforeEach(async ({ page }) => mockBackend(page));

  test('invitation link renders the attendee layout (no auth required)', async ({ page }) => {
    await page.goto('/rsvp/some-token');
    await expect(page).toHaveURL(/\/rsvp\/some-token$/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/loading your invitation|invitation not found/i)).toBeVisible();
  });

  for (const step of ['respond', 'dietary', 'payment', 'invoice', 'confirmation']) {
    test(`/rsvp/:token/${step} is publicly reachable`, async ({ page }) => {
      await page.goto(`/rsvp/some-token/${step}`);
      await expect(page).toHaveURL(new RegExp(`/rsvp/some-token/${step}$`));
    });
  }

  for (const path of ['/event/register/event-code', '/event/reg/manager-code']) {
    test(`${path} displays the logo in the event details`, async ({ page }) => {
      await page.route('**/*', async route => {
        const request = route.request();
        if (request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr') return route.fallback();
        const pathname = new URL(request.url()).pathname;
        if (pathname.endsWith('/events-properties')) return route.fulfill({ json: {
          eventsProperties: [{ eventId: 1, name: 'third_party_link', value: 'event-code' }],
        } });
        if (pathname.endsWith('/events/1')) return route.fulfill({ json: { event: {
          id: 1, title: 'Test event', date: '2027-12-01', location: 'Test venue',
          price: 0, startTime: '09:00', endTime: '10:00',
          properties: [{ name: 'third_party_link', value: 'event-code' }],
        } } });
        if (pathname.endsWith('/managers')) return route.fulfill({ json: { managers: [
          { id: 1, eventId: 1, name: 'Test Manager', thirdPartyLink: 'manager-code' },
        ] } });
        if (pathname.endsWith('/managers/1')) return route.fulfill({ json: {
          manager: { id: 1, name: 'Test Manager', thirdPartyLink: 'manager-code' },
        } });
        return route.fallback();
      });

      await page.goto(path);
      if ((page.viewportSize()?.width ?? 0) < 1024) {
        await page.getByRole('button', { name: 'Event details' }).click();
      }
      const eventPanel = page.getByRole('heading', { name: 'Test event' }).locator('..');
      const logo = eventPanel.getByRole('img', { name: 'InvestConnect' });
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', '/investconnect-logo.png');
      await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      const widths = await logo.evaluate(image => {
        const container = image.parentElement!;
        const panel = container.parentElement!;
        const panelStyle = getComputedStyle(panel);
        const containerStyle = getComputedStyle(container);
        return {
          containerWidth: container.getBoundingClientRect().width,
          panelContentWidth: panel.getBoundingClientRect().width - parseFloat(panelStyle.paddingLeft) - parseFloat(panelStyle.paddingRight),
          imageWidth: image.getBoundingClientRect().width,
          containerContentWidth: container.getBoundingClientRect().width - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight),
        };
      });
      expect(widths.containerWidth).toBeCloseTo(widths.panelContentWidth);
      expect(widths.imageWidth).toBeCloseTo(widths.containerContentWidth);
      await expect(eventPanel.getByText("You're invited")).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Register to attend' })).toBeVisible();
    });
  }

  for (const { price, total, firstWidth, secondWidth } of [
    { price: 0, total: 3, firstWidth: '33%', secondWidth: '67%' },
    { price: 100, total: 4, firstWidth: '25%', secondWidth: '50%' },
  ]) {
    test(`${price === 0 ? 'free' : 'paid'} event shows the correct RSVP progress`, async ({ page }) => {
      const invitee = {
        id: 1, eventId: 1, inviteCode: 'test-token', firstname: 'Test',
        surname: 'Attendee', email: 'test@example.com', rsvpStatus: 'pending',
      };
      await page.route('**/*', async route => {
        const request = route.request();
        if (request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr') return route.fallback();
        const path = new URL(request.url()).pathname;
        if (path.endsWith('/brands')) return route.fulfill({ json: { brands: [] } });
        if (path.endsWith('/events')) return route.fulfill({ json: { events: [{
          id: 1, title: 'Test event', date: '2026-12-01', location: 'Test venue', price,
        }] } });
        if (path.includes('/invitees/by-code/')) return route.fulfill({ json: { invitee } });
        if (path.endsWith('/invitees/1')) return route.fulfill({ json: { invitee } });
        return route.fallback();
      });

      await page.goto('/rsvp/test-token/respond');
      await expect(page.getByText(`Step 1 of ${total}`)).toBeVisible();
      await expect(page.locator('.bg-brand-600[style]')).toHaveAttribute('style', `width: ${firstWidth};`);
      await page.getByRole('button', { name: "Yes, I'll attend" }).click();
      await expect(page.getByText(`Step 2 of ${total}`)).toBeVisible();
      await expect(page.locator('.bg-brand-600[style]')).toHaveAttribute('style', `width: ${secondWidth};`);
      await page.getByRole('button', { name: 'No restrictions' }).click();
      await page.getByRole('button', { name: /continue/i }).click();
      if (price > 0) {
        await expect(page).toHaveURL(/\/payment$/);
        await expect(page.getByText('Step 3 of 4')).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/confirmation\?status=success$/);
      }
    });
  }
});
