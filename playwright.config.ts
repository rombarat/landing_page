import { defineConfig, devices } from '@playwright/test'

// E2E runs against a running app connected to the local stack
// (scripts/local-stack.sh). By default it starts `next start` on port 3100;
// set E2E_BASE_URL to reuse an already running server.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npx next start -p 3100', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
})
