import { defineConfig, devices } from '@playwright/test';

/**
 * Lumio E2E test configuration.
 * Run: pnpm e2e
 * Debug: pnpm e2e --debug
 * UI mode: pnpm e2e --ui
 */
export default defineConfig({
  testDir:  './tests/e2e',
  timeout:  30_000,
  retries:  process.env.CI ? 2 : 0,
  workers:  process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL:       process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace:         'retain-on-failure',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
    {
      name:  'mobile-chrome',
      use:   { ...devices['Pixel 7'] },
    },
  ],

  // Start dev server automatically if not already running
  webServer: {
    command:            'pnpm dev',
    url:                'http://localhost:3000',
    reuseExistingServer: true,
    timeout:            60_000,
    stderr:             'pipe',
  },
});
