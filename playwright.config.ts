import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173';
const useLocalServer = baseURL.startsWith('http://localhost');

export default defineConfig({
  testDir: './playwright_tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: useLocalServer
    ? { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 60_000 }
    : undefined,
});
