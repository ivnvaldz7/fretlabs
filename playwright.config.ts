import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for FretLabs E2E smoke tests.
 *
 * Tests run against Vite dev server (auto-started via webServer).
 * Only Chromium — the app has no browser-specific behavior.
 * No visual regression — pure smoke tests (faster, less brittle).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 15000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // one worker to avoid dev server conflicts

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  },

  webServer: {
    command: 'npx vite --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
