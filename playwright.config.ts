import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.e2e.spec.ts'],
  testIgnore: ['**/*.unit.ts'],
  timeout: 20000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3200',
    headless: true,
  },
  webServer: {
    command: 'cross-env VITE_WOW_DEMO=1 VITE_WOW_TOUR=1 VITE_WOW_TOUR_AUTOSTART=1 VITE_WOW_TOUR_SCRIPT=enterprise VITE_WOW_DIAGNOSTICS=1 VITE_OPERATOR_DIAGNOSTICS=1 npm run dev:test',
    url: 'http://127.0.0.1:3200',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
