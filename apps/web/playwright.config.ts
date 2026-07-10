import { defineConfig, devices } from "@playwright/test";

// Runs against the Docker stack (web on :5173). Users sign in through
// apps/api/scripts/test-user.ts, never through Google (ADR 0025).
export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    locale: "es-CO",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grepInvert: /@slow/ },
  ],
  globalTeardown: "./test/e2e/teardown.ts",
});
