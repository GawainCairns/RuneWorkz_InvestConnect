import { expect, test } from '@playwright/test';
import { mockBackend } from './helpers';

// The attendee pages depend on live event/invitee data, so these tests stay at the
// routing/loading level. Add seeded-data tests once a staging tenant is available.
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
});
