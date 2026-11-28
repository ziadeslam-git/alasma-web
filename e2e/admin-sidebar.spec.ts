import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// No real API: the session and /me (roles, permissions, features) are answered by the test. The hint cookie makes the
// app restore a session.
const HINT_COOKIE = 'alasma_has_session';
const PHONE_MAX_WIDTH = 760;
const COMPACT_MAX_WIDTH = 1100;
const nav = messages.admin.nav;

const ALL_PERMISSIONS = [
  'Alerts.View',
  'Audit.View',
  'Authors.Manage',
  'Books.Edit',
  'Books.ManageStock',
  'Bundles.Manage',
  'Categories.Manage',
  'Content.Manage',
  'Coupons.Manage',
  'Dashboard.View',
  'Orders.View',
  'PackageRequests.Manage',
  'Packages.Manage',
  'Pages.Manage',
  'Publishers.Manage',
  'Reports.View',
  'Reservations.Manage',
  'Reviews.Moderate',
  'Roles.Manage',
  'Settings.Manage',
  'Shipping.Manage',
  'Subscribers.View',
  'Users.View',
];
const ALL_FLAGS = [
  'Catalog.Bundles',
  'Catalog.Reservations',
  'Catalog.Reviews',
  'Cms.StaticPages',
  'Marketing.Banners',
  'Marketing.Coupons',
  'Marketing.Events',
  'Marketing.Newsletter',
  'Marketing.Quotes',
  'Orders.Alerts',
  'Publishing.ManuscriptRequests',
  'Publishing.Packages',
  'Reports.Dashboard',
];

async function signIn(page: Page, roles: string[], permissions: string[], offFlags: string[] = []) {
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
  // the orders page is opened by several tests: nothing may reach a real backend
  await page.route('**/api/v1/admin/orders?**', (route) =>
    route.fulfill({
      json: {
        hasNextPage: false,
        hasPreviousPage: false,
        items: [],
        page: 1,
        pageSize: 25,
        totalCount: 0,
        totalPages: 1,
      },
    }),
  );
  await page.route('**/api/v1/shipping/zones', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      json: {
        email: 'admin@example.test',
        emailConfirmed: true,
        features: ALL_FLAGS.map((key) => ({
          key,
          displayNameAr: key,
          isEnabled: !offFlags.includes(key),
        })),
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

// Below this width the design swaps the pills and the rail for the burger, the bottom bar and the menu sheet.
async function openSheet(page: Page) {
  await page.getByRole('button', { name: messages.admin.shell.openMenu }).click();

  return page.getByRole('dialog', { name: messages.admin.shell.sheet });
}

const isCompact = (page: Page) => (page.viewportSize()?.width ?? 0) <= COMPACT_MAX_WIDTH;
const pills = (page: Page) => page.getByRole('navigation', { name: nav.label });

test.describe('admin menu', () => {
  test('the sheet opens only the group of the current page', async ({ page }) => {
    test.skip(!isCompact(page), 'sheet only below the design breakpoint');
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS);
    await page.goto('/admin/orders');

    const sheet = await openSheet(page);

    await expect(sheet.locator('details[open]')).toHaveCount(1);
    await expect(sheet.getByRole('link', { name: nav.sheetItems.allOrders })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('the default Admin sees the Orders group only', async ({ page }) => {
    await signIn(page, ['Admin'], ['Orders.View', 'Orders.AddNote', 'Orders.RaiseAlert']);
    await page.goto('/admin/orders');

    if (isCompact(page)) {
      const sheet = await openSheet(page);

      await expect(sheet.locator('details')).toHaveCount(1);
      await expect(sheet.getByRole('link')).toContainText([nav.sheetItems.allOrders]);
    } else {
      await expect(pills(page).locator('[data-nav-group]')).toHaveCount(1);
      await expect(pills(page).getByRole('link', { name: nav.groups.orders })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  test('a SuperAdmin sees the eight groups; unbuilt pages are inert, never links', async ({
    page,
  }) => {
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS, ['Marketing.Banners']);
    await page.goto('/admin');

    if (isCompact(page)) {
      const sheet = await openSheet(page);

      await expect(sheet.locator('details')).toHaveCount(8);

      const locked = sheet.locator('[aria-disabled="true"]', { hasText: nav.sheetItems.banners });

      await expect(locked).toHaveCount(1);
      await expect(locked).toContainText(nav.soon);
      await expect(sheet.getByRole('link', { name: nav.sheetItems.allBooks })).toHaveCount(0);
    } else {
      await expect(pills(page).locator('[data-nav-group]')).toHaveCount(8);
      await expect(pills(page).getByRole('link', { name: nav.groups.overview })).toHaveAttribute(
        'href',
        '/admin',
      );
      await expect(pills(page).locator('[data-nav-group="books"]')).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expect(pills(page).getByRole('link', { name: nav.groups.books })).toHaveCount(0);
    }
  });

  test('a Developer sees the Developer page in the settings group', async ({ page }) => {
    test.skip(!isCompact(page), 'the full page lists live in the sheet');
    await signIn(page, ['Developer'], ALL_PERMISSIONS);
    await page.goto('/admin');

    const sheet = await openSheet(page);

    await sheet.locator('summary', { hasText: nav.groups.settings }).click();
    await expect(sheet.getByText(nav.sheetItems.devPanel)).toBeVisible();
  });

  test('the keyboard reaches the pill link and skips the inert ones', async ({ page }) => {
    test.skip(isCompact(page), 'the pills are the wide layout');
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS);
    await page.goto('/admin/orders');

    await pills(page).getByRole('link', { name: nav.groups.overview }).focus();
    await page.keyboard.press('Tab');

    await expect(pills(page).getByRole('link', { name: nav.groups.orders })).toBeFocused();
  });

  test('the rail shows the current page and the logout is a button', async ({ page }) => {
    test.skip(isCompact(page), 'the rail is the wide layout');
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS);
    await page.goto('/admin/orders');

    const rail = page.getByRole('complementary', { name: messages.admin.shell.quickNav });

    await expect(rail.getByRole('link', { name: nav.groups.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(rail.getByRole('button', { name: messages.admin.shell.logout })).toBeVisible();
  });

  test('the bottom bar replaces the rail on a phone and opens the sheet', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) > PHONE_MAX_WIDTH, 'phone only');
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS);
    await page.goto('/admin/orders');

    const bar = page.getByRole('navigation', { name: messages.admin.shell.bottomNav });

    await expect(bar.getByRole('link', { name: nav.groups.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await bar.getByRole('button', { name: messages.admin.shell.more }).click();
    await expect(page.getByRole('dialog', { name: messages.admin.shell.sheet })).toBeVisible();
  });
});
