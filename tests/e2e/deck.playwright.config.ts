import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["deck-smoke-00-04.e2e.spec.ts"],
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3290",
    headless: true,
  },
  webServer: {
    command: "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3290 --strictPort",
    cwd: process.cwd(),
    url: "http://127.0.0.1:3290",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
