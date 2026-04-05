import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const projectRoot = process.cwd();
const nodeCommand = process.execPath;
const runNextScript = path.join(projectRoot, "scripts", "run-next.mjs");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: `"${nodeCommand}" "${runNextScript}" start --hostname 127.0.0.1 --port 3001`,
    cwd: projectRoot,
    url: "http://127.0.0.1:3001",
    env: {
      ...process.env,
      NEXT_DIST_DIR: ".next-prod"
    },
    reuseExistingServer: true,
    timeout: 120_000
  }
});
