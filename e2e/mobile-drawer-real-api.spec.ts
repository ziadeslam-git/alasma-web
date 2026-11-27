import { randomBytes } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Task 84: the signed-in mobile menu has the account link and, pinned at the bottom, logout; using it ends the session
// and leaves a signed-out page. Self-registered user in the isolated API (no customer credentials needed).
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'default' });
test.use({ baseURL: webOrigin, actionTimeout: 20_000 });

test.beforeAll(async () => {
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

async function registerAndLogin(page: Page) {
  const email = `e2e-drawer-${Date.now()}-${randomBytes(3).toString('hex')}@example.com`;
  const password = `Aa1!${randomBytes(12).toString('base64url')}`;
  await page.goto('/register');
  await page.locator('[name="fullName"]').fill('E2E Drawer');
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="phone"]').fill('01000000000');
  await page.locator('[name="password"]').fill(password);
  await page.locator('[name="confirmPassword"]').fill(password);
  await page.locator('[name="terms"]').check();
  await page.getByRole('button', { name: messages.auth.register, exact: true }).click();
  await expect(page.getByText(messages.auth.registerSuccessTitle)).toBeVisible({ timeout: 30_000 });
  await page.goto('/login');
  const form = page.locator('#main-content form:has(input[name="email"]:enabled)');
  await expect(form).toHaveCount(1, { timeout: 30_000 });
  await form.locator('[name="email"]').fill(email);
  await form.locator('[name="password"]').fill(password);
  await form.getByRole('button', { name: messages.auth.login, exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });
}

test('logout from the mobile menu ends the session', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-1280', 'the menu button exists only up to 1000px');
  test.setTimeout(240_000);
  await registerAndLogin(page);

  await page.goto('/');
  await page.getByRole('button', { name: messages.site.header.menu }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: messages.account.title })).toBeVisible();
  const logout = dialog.getByRole('button', { name: messages.account.logout });
  await expect(logout).toBeVisible();
  // pinned below the links: its box starts under the last link
  const lastLink = await dialog.getByRole('link').last().boundingBox();
  const logoutBox = await logout.boundingBox();
  expect(logoutBox!.y).toBeGreaterThan(lastLink!.y + lastLink!.height);

  await logout.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // signed out: the hint cookie is gone, a reload stays signed out, and the menu is the guest one
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === 'alasma_has_session'))
    .toBe(false);
  await page.reload();
  await page.getByRole('button', { name: messages.site.header.menu }).click();
  const guestMenu = page.getByRole('dialog');
  // the guest menu has no login button any more: the account tile goes to /login
  await expect(guestMenu.getByRole('link', { name: messages.account.title })).toHaveAttribute(
    'href',
    '/login',
  );
  await expect(guestMenu.getByRole('button', { name: messages.account.logout })).toHaveCount(0);
});
