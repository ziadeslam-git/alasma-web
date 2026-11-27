import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// No real API: the session and /me (roles, permissions, features) are answered by the test. The hint cookie makes the
// app restore a session.
const HINT_COOKIE = 'alasma_has_session';
const PHONE_MAX_WIDTH = 1000;
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

// On a phone the menu lives in the drawer of the header.
async function openMenuIfPhone(page: Page) {
  if ((page.viewportSize()?.width ?? 0) <= PHONE_MAX_WIDTH) {
    await page.getByRole('button', { name: messages.admin.shell.menu }).click();
    // the drawer starts with only the current group open; open the rest to look at every link
    await page.evaluate(() => {
      document.querySelectorAll('[data-admin-nav] details').forEach((group) => {
        (group as HTMLDetailsElement).open = true;
      });
    });
  }
}

const menu = (page: Page) => page.getByRole('navigation', { name: nav.label });

test.describe('admin menu', () => {
  test('the phone drawer opens only the group of the current page', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) > PHONE_MAX_WIDTH, 'phone drawer only');
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS);
    await page.goto('/admin/orders');
    await page.getByRole('button', { name: messages.admin.shell.menu }).click();

    await expect(menu(page).locator('[data-nav-group="operations"]')).toHaveAttribute('open', '');
    await expect(menu(page).locator('[data-nav-group="catalog"]')).not.toHaveAttribute('open', '');
  });

  test('the default Admin sees Orders and Payments only', async ({ page }) => {
    await signIn(page, ['Admin'], ['Orders.View', 'Orders.AddNote', 'Orders.RaiseAlert']);
    await page.goto('/admin');
    await openMenuIfPhone(page);

    const links = menu(page).getByRole('link');

    await expect(links).toHaveText([nav.items.orders, nav.items.payments]);
  });

  test('a SuperAdmin sees every section except the Developer one, and a locked one faded', async ({
    page,
  }) => {
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS, ['Marketing.Banners']);
    await page.goto('/admin');
    await openMenuIfPhone(page);

    await expect(menu(page).getByRole('link')).toHaveCount(25);
    await expect(menu(page).getByRole('link', { name: nav.items.dev })).toHaveCount(0);

    const locked = menu(page).locator('[aria-disabled="true"]');

    await expect(locked).toHaveCount(1);
    await expect(locked).toContainText(nav.items.banners);
    await expect(locked).toContainText(nav.soon);
  });

  test('a Developer sees the Developer section', async ({ page }) => {
    await signIn(page, ['Developer'], ALL_PERMISSIONS);
    await page.goto('/admin');
    await openMenuIfPhone(page);

    await expect(menu(page).getByRole('link', { name: nav.items.dev })).toHaveAttribute(
      'href',
      '/admin/dev',
    );
  });

  test('the current page is marked and a group can be collapsed on wide screens', async ({
    page,
  }) => {
    await signIn(page, ['SuperAdmin'], ALL_PERMISSIONS);
    await page.goto('/admin/orders');
    await openMenuIfPhone(page);

    await expect(menu(page).getByRole('link', { name: nav.items.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );

    if ((page.viewportSize()?.width ?? 0) > PHONE_MAX_WIDTH) {
      const group = menu(page).locator('[data-nav-group="catalog"]');

      await expect(group).toHaveAttribute('open', '');
      await group.locator('summary').click();
      await expect(group).not.toHaveAttribute('open', '');
    }
  });
});
