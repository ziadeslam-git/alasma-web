import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// No real API: the session, the order list and the zone list are answered by the test.
const HINT_COOKIE = 'alasma_has_session';
const copy = messages.admin.orders;

const ORDERS = Array.from({ length: 5 }, (_, index) => ({
  createdAt: '2026-10-12T10:00:00Z',
  expiresAt: null,
  governorate: 'القاهرة',
  itemsCount: index + 1,
  orderId: `00000000-0000-0000-0000-00000000000${index + 1}`,
  orderNumber: `AS-2040${index}`,
  paymentMethod: index % 2 === 0 ? 'CashOnDelivery' : 'ManualTransfer',
  phone: '01000000000',
  recipientName: 'أحمد محمد',
  status: index % 2 === 0 ? 'PaymentReview' : 'Shipped',
  total: 412 + index,
}));

async function openOrders(page: Page, permissions: string[], orders = ORDERS) {
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
        roles: ['Admin'],
      },
    }),
  );
  await page.route('**/api/v1/shipping/zones', (route) =>
    route.fulfill({
      json: [
        {
          estimatedDays: 2,
          freeShippingThreshold: null,
          id: 1,
          nameAr: 'القاهرة',
          nameEn: 'Cairo',
          shippingPrice: 40,
        },
      ],
    }),
  );
  await page.route('**/api/v1/admin/orders?**', (route) =>
    route.fulfill({
      json: {
        hasNextPage: false,
        hasPreviousPage: false,
        items: orders,
        page: 1,
        pageSize: 25,
        totalCount: orders.length,
        totalPages: 1,
      },
    }),
  );
  await page.goto('/admin/orders');
}

test.describe('admin orders list', () => {
  test('shows the orders, has no horizontal scroll and no accessibility violations', async ({
    page,
  }) => {
    await openOrders(page, ['Orders.View']);

    await expect(page.getByRole('heading', { name: copy.title, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AS-20400' })).toHaveAttribute(
      'href',
      /\/admin\/orders\/00000000-0000-0000-0000-000000000001$/,
    );

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('a status tab writes the status to the URL and asks the API for it', async ({ page }) => {
    await openOrders(page, ['Orders.View']);
    await page.getByRole('link', { name: 'AS-20400' }).waitFor();

    const request = page.waitForRequest(
      (item) =>
        item.url().includes('/api/v1/admin/orders?') && item.url().includes('status=Shipped'),
    );

    await page
      .getByRole('link', { name: messages.admin.status.order.Shipped, exact: true })
      .click();
    await request;
    await expect(page).toHaveURL(/status=Shipped/);
  });

  test('an unknown status in the URL does not break the page', async ({ page }) => {
    await openOrders(page, ['Orders.View']);
    await page.goto('/admin/orders?status=Bogus');

    await expect(page.getByRole('link', { name: 'AS-20400' })).toBeVisible();
  });

  test('without Orders.View the page shows the 403 screen', async ({ page }) => {
    await openOrders(page, []);

    await expect(page.getByRole('heading', { name: messages.admin.forbidden.title })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AS-20400' })).toHaveCount(0);
  });
});
