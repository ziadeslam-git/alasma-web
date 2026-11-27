import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// No real API: /auth/refresh and /me are answered by the test. The hint cookie makes the app try to restore a session.
const HINT_COOKIE = 'alasma_has_session';

async function signInAs(page: Page, roles: string[], permissions: string[]) {
  await page
    .context()
    .addCookies([{ name: HINT_COOKIE, value: '1', url: 'http://localhost:3100' }]);
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      json: {
        accessToken: 'e2e-access-token',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        user: {},
      },
    }),
  );
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      json: {
        email: 'admin@example.test',
        emailConfirmed: true,
        features: [],
        fullName: 'Test Admin',
        id: 1,
        permissions,
        phone: null,
        preferredLanguage: 'ar',
        roles,
      },
    }),
  );
}

test.describe('admin frame', () => {
  test('a SuperAdmin sees the frame with the header', async ({ page }) => {
    await signInAs(page, ['SuperAdmin'], ['Roles.Manage']);
    await page.goto('/admin');

    await expect(page.locator('[data-admin-frame]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: messages.admin.shell.landingTitle }),
    ).toBeVisible();
    await expect(page.getByText('Test Admin').first()).toBeVisible();
    await expect(page.getByText(messages.admin.roles.SuperAdmin).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('a Customer sees the 403 screen', async ({ page }) => {
    await signInAs(page, ['Customer'], []);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: messages.admin.forbidden.title })).toBeVisible();
    await expect(page.locator('[data-admin-frame]')).toHaveCount(0);
  });

  test('a visitor goes to the login and keeps the path', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
  });

  test('an unknown admin path shows the not-found screen inside the frame', async ({ page }) => {
    await signInAs(page, ['Admin'], []);
    await page.goto('/admin/nothing-here');

    await expect(page.locator('[data-admin-frame]')).toBeVisible();
    await expect(page.getByRole('heading', { name: messages.admin.notFound.title })).toBeVisible();
  });
});
