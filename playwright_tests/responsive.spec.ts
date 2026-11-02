import { expect, test } from '@playwright/test';
import { mockBackend } from './helpers';

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => mockBackend(page));

  for (const path of ['/', '/login', '/register', '/forgot-password']) {
    test(`${path} has no horizontal overflow on a phone`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
