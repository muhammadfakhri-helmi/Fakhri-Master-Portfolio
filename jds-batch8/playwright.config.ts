import { defineConfig, devices } from "@playwright/test";
import { SITE_URL } from "./tests/e2e/env.ts";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { trace: "retain-on-failure", acceptDownloads: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /reviewer\.spec/ },
  ],
  webServer: {
    command: "node tests/e2e/serve.ts",
    url: SITE_URL,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
  },
});
