import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const devPort = 3101;

// End-to-end and accessibility tests, Chromium only, at the three design viewports. They run against the
// production build. Run by the owner or Claude Code, not by Codex (its sandbox cannot run a browser reliably).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    // headless Chromium hides scrollbars by default; keep them so the scroll-lock layout-jump check is real
    launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
  },
  projects: [
    {
      name: 'mobile-360',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } },
    },
    {
      name: 'tablet-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: [
    {
      // the production build: every spec except the overlay ones
      command: `pnpm build && pnpm exec next start -p ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      // next dev (it writes to .next/dev, so it does not clash with the build): the dev-only /dev/components page that
      // the overlay specs use. That page returns 404 in a production build.
      command: `pnpm exec next dev -p ${devPort}`,
      url: `http://localhost:${devPort}/dev/components`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
});
