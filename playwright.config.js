import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:5501',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Always start fresh to avoid localStorage pollution between test files
    storageState: undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start Python static server for E2E tests
  webServer: {
    command: 'python -m http.server 5501',
    url: 'http://localhost:5501',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
