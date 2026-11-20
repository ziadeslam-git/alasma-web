import { defineConfig, devices } from '@playwright/test';

import { DEFAULT_API_PORT, isApiReuseAllowed, resolveApiPort } from './e2e/support/real-api-port';

const port = 3100;
const devPort = 3101;
// Real-API opt-in (owner only). The port guard runs HERE, at config load, before any server or API starts: an unsafe or
// invalid E2E_API_PORT (5198 is the main backend, always rejected) stops everything. Both web servers forward /api/v1/*
// and render Server Components against this one validated port. Without E2E_REAL_API nothing below changes.
const isRealApi = process.env.E2E_REAL_API === '1';
const realApiPort = isRealApi ? resolveApiPort() : DEFAULT_API_PORT;
const realApiOrigin = `http://localhost:${realApiPort}`;
// A running web server (and API) is reused only with E2E_REUSE_API=1; a stale server could point at another API.
const canReuseServer = !process.env.CI && (!isRealApi || isApiReuseAllowed());
// Spec files each spawn their own API on the one port, so they must not overlap unless a reused API is allowed.
const realApiWorkers = isRealApi && !isApiReuseAllowed() ? 1 : undefined;

// End-to-end and accessibility tests, Chromium only, at the three design viewports. They run against the
// production build. Run by the owner or Claude Code, not by Codex (its sandbox cannot run a browser reliably).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: realApiWorkers ?? (process.env.CI ? undefined : 3),
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
      env: isRealApi ? { API_ORIGIN: realApiOrigin } : {},
      reuseExistingServer: canReuseServer,
      timeout: 300_000,
    },
    {
      // next dev (its own .next-e2e folder, so it clashes with neither the build nor a normal dev server): the dev-only /dev/components page that
      // the overlay specs use. That page returns 404 in a production build.
      command: `pnpm exec next dev -p ${devPort}`,
      // its own output folder, so it can run while the owner's `pnpm dev` is running on port 3000
      env: {
        NEXT_DIST_DIR: '.next-e2e',
        ...(isRealApi ? { API_ORIGIN: realApiOrigin } : {}),
      },
      url: `http://localhost:${devPort}/dev/components`,
      reuseExistingServer: canReuseServer,
      timeout: 300_000,
    },
  ],
});
