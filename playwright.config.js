const { defineConfig } = require("@playwright/test");
const previewPort = Number(process.env.FREEHUB_TEST_PORT || 4318);

module.exports = defineConfig({
  testDir: "./tests/browser",
  outputDir: "output/playwright/test-results",
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/playwright/report", open: "never" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${previewPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "node tests/browser/server.js",
    url: `http://127.0.0.1:${previewPort}/`,
    env: { PORT: String(previewPort) },
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
