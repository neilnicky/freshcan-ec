import { defineConfig, devices } from "@playwright/test";

// E2E runs against the production build: `pnpm build && pnpm test:e2e`.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  // Each page runs software WebGL in CI/headless; too many at once starves the frame loop.
  workers: 3,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4323" },
  webServer: {
    command: "pnpm astro preview --port 4323 --host 127.0.0.1 --ignore-lock",
    url: "http://127.0.0.1:4323",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
