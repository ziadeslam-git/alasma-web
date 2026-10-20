import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

import messages from '../src/i18n/messages/ar.json';

// Opt-in proof of the F1.9 session logic against the REAL API in a real browser. Skipped unless E2E_REAL_API=1.
//   E2E_REAL_API=1 pnpm exec playwright test e2e/auth-real-api.spec.ts --project=desktop-1280
// The spec starts the API itself (dotnet run, Development, SMTP emptied so no email is sent, this origin allowed by
// CORS) on E2E_API_PORT (default 5391, never 5198), reads confirmation links from the API log, and stops the API by
// its own PID. The Next dev server of playwright.config.ts forwards /api/v1/* to that API. It needs LocalDB and the
// backend folder (E2E_API_DIR, default ../AlAsmaPro). The throw-away users it registers stay in the dev database.
const isEnabled = process.env.E2E_REAL_API === '1';
const apiPort = Number(process.env.E2E_API_PORT ?? 5391);
const apiDir = resolve(process.env.E2E_API_DIR ?? '../AlAsmaPro');
const apiOrigin = `http://localhost:${apiPort}`;
const webOrigin = 'http://localhost:3101';
const text = messages.devAuth;

test.skip(!isEnabled, 'Set E2E_REAL_API=1 to run against the real API.');
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

type User = { email: string; password: string };

let api: ChildProcess | undefined;
let apiLog = '';

async function startApi() {
  api = spawn(
    'dotnet',
    ['run', '--project', 'src/AlAsmaPro.Api', '--no-launch-profile', '--urls', apiOrigin],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: 'Development',
        Cors__AllowedOrigins__0: 'http://localhost:3000',
        Cors__AllowedOrigins__1: webOrigin,
        Smtp__FromAddress: '',
        Smtp__Password: '',
        Smtp__UserName: '',
      },
    },
  );
  const collect = (chunk: Buffer) => {
    apiLog += chunk.toString();
  };
  api.stdout?.on('data', collect);
  api.stderr?.on('data', collect);

  await expect
    .poll(() => apiLog.includes('Now listening on'), { intervals: [500], timeout: 180_000 })
    .toBe(true);
}

function stopApi() {
  const pid = api?.pid;

  if (pid === undefined) {
    return;
  }

  // our own process tree only (dotnet run starts the real server as a child)
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  } else {
    api?.kill('SIGTERM');
  }
}

async function createUser(label: string): Promise<User> {
  const email = `e2e-${label}-${Date.now()}@example.com`;
  const password = `Aa1!${randomBytes(12).toString('base64url')}`;
  const register = await fetch(`${apiOrigin}/api/v1/auth/register`, {
    body: JSON.stringify({ email, fullName: `E2E ${label}`, password, phone: '01000000000' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  expect(register.status).toBe(201);

  let link: { userId: number; token: string } | undefined;

  await expect
    .poll(
      () => {
        const at = apiLog.lastIndexOf(`Email to ${email}`);
        const match = /href="[^"]*userId=(\d+)&amp;token=([^"]+)"/.exec(
          at < 0 ? '' : apiLog.slice(at),
        );
        link =
          match?.[1] && match[2]
            ? { userId: Number(match[1]), token: decodeURIComponent(match[2]) }
            : undefined;

        return link !== undefined;
      },
      { intervals: [300], timeout: 20_000 },
    )
    .toBe(true);

  const confirm = await fetch(`${apiOrigin}/api/v1/auth/confirm-email`, {
    body: JSON.stringify(link),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  expect(confirm.status).toBe(204);

  return { email, password };
}

type Wire = { count: (path: string) => number; list: () => string[]; reset: () => void };

// Every request a context makes to /api/v1, in order, as "METHOD /path".
function watch(context: BrowserContext): Wire {
  let seen: string[] = [];
  context.on('request', (request) => {
    const url = new URL(request.url());

    if (url.pathname.startsWith('/api/v1/')) {
      seen.push(`${request.method()} ${url.pathname}`);
    }
  });

  return {
    count: (path) => seen.filter((entry) => entry.endsWith(path)).length,
    list: () => [...seen],
    reset: () => {
      seen = [];
    },
  };
}

const statusOf = (page: Page) => page.getByTestId('auth-status');
const waitStatus = (page: Page, name: string) =>
  expect(statusOf(page)).toHaveText(name, { timeout: 30_000 });
const refreshCookie = async (context: BrowserContext) =>
  (await context.cookies()).find((cookie) => cookie.name === 'alasma_rt');
const hintCookie = async (context: BrowserContext) =>
  (await context.cookies()).find((cookie) => cookie.name === 'alasma_has_session');

async function signIn(page: Page, user: User) {
  await page.goto('/dev/auth');
  await waitStatus(page, text.statusNames.anonymous);
  await page.getByLabel(text.emailLabel).fill(user.email);
  await page.getByLabel(text.passwordLabel).fill(user.password);
  await page.getByRole('button', { name: text.login, exact: true }).click();
  await waitStatus(page, text.statusNames.authenticated);
}

let userA: User;
let userB: User;

test.beforeAll(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-1280',
    'one viewport is enough for the session logic',
  );
  test.setTimeout(300_000);
  await startApi();
  userA = await createUser('a');
  userB = await createUser('b');
});

test.afterAll(() => {
  stopApi();
});

test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-1280',
    'one viewport is enough for the session logic',
  );
  test.setTimeout(120_000);
});

test('login works and /me returns the user, the refresh cookie stays out of reach of script', async ({
  context,
  page,
}) => {
  const wire = watch(context);

  await signIn(page, userA);

  await expect(page.getByText(`E2E a`)).toBeVisible();
  expect(wire.count('/auth/login')).toBe(1);
  expect(wire.count('/me')).toBe(1);
  expect(wire.count('/auth/refresh')).toBe(0);
  expect((await refreshCookie(context))?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('alasma_rt');
  console.log('login scenario requests:', wire.list());
});

test('a fresh page load restores the session from the cookie', async ({ context, page }) => {
  await signIn(page, userA);
  const wire = watch(context);

  await page.reload();
  await waitStatus(page, text.statusNames.authenticated);

  expect(wire.count('/auth/refresh')).toBe(1);
  expect(wire.count('/me')).toBe(1);
  console.log('reload scenario requests:', wire.list());
});

test('five parallel force-refresh clicks in one tab send ONE refresh request and keep the session', async ({
  context,
  page,
}) => {
  await signIn(page, userA);
  const wire = watch(context);
  const before = (await refreshCookie(context))?.value;

  await page.evaluate((label) => {
    const button = [...document.querySelectorAll('button')].find(
      (one) => one.textContent === label,
    );

    for (let click = 0; click < 5; click += 1) {
      button?.click();
    }
  }, text.forceRefresh);
  await expect(page.getByTestId('auth-result')).toHaveText(text.refreshDone);

  expect(wire.count('/auth/refresh')).toBe(1);
  expect((await refreshCookie(context))?.value).not.toBe(before);
  await page.getByRole('button', { name: text.callMeTwice }).click();
  await expect(page.getByTestId('auth-result')).toContainText('E2E a | E2E a');
  await waitStatus(page, text.statusNames.authenticated);
  console.log('parallel-refresh scenario requests:', wire.list());
});

test('two tabs of one browser load at the same moment, both end authenticated and the cookie is still valid', async ({
  context,
}) => {
  const first = await context.newPage();
  await signIn(first, userA);
  const second = await context.newPage();
  const wire = watch(context);

  await Promise.all([first.goto('/dev/auth'), second.goto('/dev/auth')]);
  await waitStatus(first, text.statusNames.authenticated);
  await waitStatus(second, text.statusNames.authenticated);

  const refreshes = wire.count('/auth/refresh');
  expect(refreshes).toBeGreaterThanOrEqual(1);
  expect(refreshes).toBeLessThanOrEqual(2);
  expect(await refreshCookie(context)).toBeDefined();

  // the cookie is still good: a new forced refresh works from either tab
  await first.getByRole('button', { name: text.forceRefresh }).click();
  await expect(first.getByTestId('auth-result')).toHaveText(text.refreshDone);
  await waitStatus(second, text.statusNames.authenticated);
  console.log('two-tab scenario requests:', wire.list());
});

test('logging out in one tab logs the other tab out', async ({ context }) => {
  const first = await context.newPage();
  await signIn(first, userB);
  const second = await context.newPage();
  await second.goto('/dev/auth');
  await waitStatus(second, text.statusNames.authenticated);

  await first.getByRole('button', { name: text.logout }).click();

  await waitStatus(first, text.statusNames.anonymous);
  await waitStatus(second, text.statusNames.anonymous);
  expect(await refreshCookie(context)).toBeUndefined();
  expect(await hintCookie(context)).toBeUndefined();
});

test('an anonymous visitor makes no refresh request', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: webOrigin });
  const wire = watch(context);
  const page = await context.newPage();

  await page.goto('/dev/auth');
  await waitStatus(page, text.statusNames.anonymous);
  await page.goto('/');
  await page.waitForTimeout(1_500);

  expect(wire.count('/auth/refresh')).toBe(0);
  expect(wire.list()).toEqual([]);
  await context.close();
});

test('after the refresh cookie is gone the next refresh fails, the session clears and nothing loops', async ({
  context,
  page,
}) => {
  await signIn(page, userA);
  const wire = watch(context);

  await context.clearCookies({ name: 'alasma_rt' });
  await page.getByRole('button', { name: text.forceRefresh }).click();

  await waitStatus(page, text.statusNames.anonymous);
  await page.waitForTimeout(3_000);
  expect(wire.count('/auth/refresh')).toBe(1);
  expect(await hintCookie(context)).toBeUndefined();
  console.log('dead-cookie scenario requests:', wire.list());
});
