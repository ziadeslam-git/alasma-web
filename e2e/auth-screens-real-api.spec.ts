import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

import messages from '../src/i18n/messages/ar.json';

// Opt-in proof of the Login and Register screens against the REAL API in a real browser. Skipped unless E2E_REAL_API=1:
//   E2E_REAL_API=1 pnpm exec playwright test e2e/auth-screens-real-api.spec.ts --project=desktop-1280
// Same setup as e2e/auth-real-api.spec.ts (it starts the API with dotnet run on E2E_API_PORT, default 5391, never 5198;
// SMTP emptied so no email is sent; this origin allowed by CORS; the API is stopped by its own PID). Run the two
// real-API specs one after the other, not together: they use the same API port. The throw-away users it registers stay
// in the dev database.
const isEnabled = process.env.E2E_REAL_API === '1';
const apiPort = Number(process.env.E2E_API_PORT ?? 5391);
const apiDir = resolve(process.env.E2E_API_DIR ?? '../AlAsmaPro');
const apiOrigin = `http://localhost:${apiPort}`;
const webOrigin = 'http://localhost:3101';
const text = messages.auth;

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

async function confirmEmail(email: string) {
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
            ? { token: decodeURIComponent(match[2]), userId: Number(match[1]) }
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
}

type Wire = { count: (path: string) => number; list: () => string[] };

// Every request a context makes to /api/v1, in order, as "METHOD /path".
function watch(context: BrowserContext): Wire {
  const seen: string[] = [];
  context.on('request', (request) => {
    const url = new URL(request.url());

    if (url.pathname.startsWith('/api/v1/')) {
      seen.push(`${request.method()} ${url.pathname}`);
    }
  });

  return {
    count: (path) => seen.filter((entry) => entry.endsWith(path)).length,
    list: () => [...seen],
  };
}

const newUser = (label: string): User => ({
  email: `e2e-screens-${label}-${Date.now()}@example.com`,
  password: `Aa1!${randomBytes(12).toString('base64url')}`,
});

async function register(page: Page, user: User) {
  await page.goto('/register');
  await page.locator('[name="fullName"]').fill('E2E Screens');
  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="phone"]').fill('01000000000');
  await page.locator('[name="password"]').fill(user.password);
  await page.locator('[name="confirmPassword"]').fill(user.password);
  await page.locator('[name="terms"]').check();
  await page.getByRole('button', { name: text.register, exact: true }).click();
  await expect(page.getByText(text.registerSuccessTitle)).toBeVisible({ timeout: 30_000 });
}

const activeLoginForm = (page: Page): Locator =>
  page.locator('#main-content form:has(input[name="email"]:enabled)');

async function fillLogin(page: Page, user: User, password = user.password) {
  const form = activeLoginForm(page);

  await form.locator('[name="email"]').fill(user.email);
  await form.locator('[name="password"]').fill(password);
  await form.getByRole('button', { name: text.login, exact: true }).click();
}

const hintCookie = async (context: BrowserContext) =>
  (await context.cookies()).find((cookie) => cookie.name === 'alasma_has_session');
const waitForLoginForm = async (page: Page) => {
  const form = activeLoginForm(page);

  await expect(form).toHaveCount(1, { timeout: 30_000 });
  await expect(form.locator('[name="email"]')).toBeEnabled();
};

let confirmed: User;
let unconfirmed: User;

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'one viewport is enough for these flows');
  test.setTimeout(300_000);
  await startApi();
});

test.afterAll(() => {
  stopApi();
});

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'one viewport is enough for these flows');
  test.setTimeout(120_000);
});

test('registers through the Register screen and shows the success state without signing in', async ({
  context,
  page,
}) => {
  const wire = watch(context);
  confirmed = newUser('confirmed');

  await register(page, confirmed);

  await expect(
    page.locator('#main-content').getByRole('link', { name: text.login }),
  ).toHaveAttribute('href', '/login');
  expect(wire.count('/auth/register')).toBe(1);
  expect(wire.count('/auth/login')).toBe(0);
  expect(wire.count('/auth/refresh')).toBe(0);
  expect(await hintCookie(context)).toBeUndefined();
  console.log('register scenario requests:', wire.list());

  await confirmEmail(confirmed.email);
});

test('a wrong password shows the Arabic message and does not sign in', async ({
  context,
  page,
}) => {
  const wire = watch(context);
  await page.goto('/login');
  await waitForLoginForm(page);

  await fillLogin(page, confirmed, 'Wrong-password-1');

  await expect(page.locator('#main-content').getByRole('alert')).toHaveText(
    messages.apiErrors.codes.auth_invalid_credentials,
  );
  await expect(page).toHaveURL(/\/login$/);
  expect(wire.list()).toEqual(['POST /api/v1/auth/login']);
  expect(await hintCookie(context)).toBeUndefined();
  console.log('wrong-password scenario requests:', wire.list());
});

test('logs in through the Login screen and lands on home signed in; /login then redirects away', async ({
  context,
  page,
}) => {
  const wire = watch(context);
  await page.goto('/login');
  await waitForLoginForm(page);

  await fillLogin(page, confirmed);

  await expect(page).toHaveURL(`${webOrigin}/`);
  expect(wire.list()).toEqual(['POST /api/v1/auth/login', 'GET /api/v1/me']);
  expect(await hintCookie(context)).toBeDefined();
  console.log('login scenario requests:', wire.list());

  // already signed in: a fresh visit to /login restores the session and leaves the page
  await page.goto('/login');
  await expect(page).toHaveURL(`${webOrigin}/`, { timeout: 30_000 });
  expect(wire.count('/auth/login')).toBe(1);
  expect(wire.count('/auth/refresh')).toBe(1);
  console.log('login-while-authenticated scenario requests:', wire.list());
});

test('/login?next=/books goes to /books after login', async ({ page }) => {
  await page.goto('/login?next=/books');
  await waitForLoginForm(page);

  await fillLogin(page, confirmed);

  await expect(page).toHaveURL(`${webOrigin}/books`);
});

test('/login?next=https://evil.com goes to home after login', async ({ page }) => {
  await page.goto(`/login?next=${encodeURIComponent('https://evil.com')}`);
  await waitForLoginForm(page);

  await fillLogin(page, confirmed);

  await expect(page).toHaveURL(`${webOrigin}/`);
});

test('a user with an unconfirmed email can sign in and sees the confirmation toast', async ({
  context,
  page,
}) => {
  unconfirmed = newUser('unconfirmed');
  await register(page, unconfirmed);
  const wire = watch(context);

  await page.goto('/login');
  await waitForLoginForm(page);
  await fillLogin(page, unconfirmed);

  await expect(page.getByText(text.unconfirmedToast)).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(`${webOrigin}/`);
  expect(wire.list()).toEqual(['POST /api/v1/auth/login', 'GET /api/v1/me']);
  console.log('unconfirmed scenario requests:', wire.list());
});

test('the login screen has no staff link', async ({ page }) => {
  await page.goto('/login');
  await waitForLoginForm(page);

  const hrefs = await page
    .locator('main a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));

  expect(hrefs).toEqual(['/forgot-password', '/register']);
});
