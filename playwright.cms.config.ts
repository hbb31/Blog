import { defineConfig, devices } from '@playwright/test';

// Optional: use a preinstalled Chromium instead of `npx playwright install`.
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};

/** End-to-end CMS test against `astro dev` with Keystatic in local mode. Writes and then deletes test content. */
export default defineConfig({
  testDir: './tests/cms',
  timeout: 300_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4400',
    ...devices['Desktop Chrome'],
    viewport: { width: 1400, height: 1000 },
    launchOptions,
  },
  webServer: {
    command: 'npx astro dev --port 4400',
    url: 'http://127.0.0.1:4400',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
