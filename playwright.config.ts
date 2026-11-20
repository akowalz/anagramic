import { defineConfig } from "@playwright/test"

// Its own port, so the tests never collide with a dev server you're running
const PORT = 5199

/*
 * UI tests in a real browser (see e2e/). Run with `npm run test:ui`. They use
 * the Chrome installed on this machine, so there's no browser to download.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    // A phone, since the app is made for phones first
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
})
