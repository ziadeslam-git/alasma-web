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

const KPI_TOTALS: Record<string, number> = {
  '': 23,
  PaymentReview: 7,
  Preparing: 12,
  Shipped: 18,
};

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
  await page.route('**/api/v1/admin/orders?**', (route) => {
    const url = new URL(route.request().url());

    // The four summary cards ask for one row and read only totalCount; the list asks for a page.
    if (url.searchParams.get('pageSize') === '1') {
      return route.fulfill({
        json: {
          hasNextPage: true,
          hasPreviousPage: false,
          items: [],
          page: 1,
          pageSize: 1,
          totalCount: KPI_TOTALS[url.searchParams.get('status') ?? ''] ?? 0,
          totalPages: 1,
        },
      });
    }

    return route.fulfill({
      json: {
        hasNextPage: false,
        hasPreviousPage: false,
        items: orders,
        page: 1,
        pageSize: 25,
        totalCount: orders.length,
        totalPages: 1,
      },
    });
  });
  await page.goto('/admin/orders');
}

test.describe('admin orders list', () => {
  test('shows the orders, has no horizontal scroll and no accessibility violations', async ({
    page,
  }) => {
    await openOrders(page, ['Orders.View']);

    await expect(page.getByRole('heading', { name: copy.title, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: '#AS-20400' })).toHaveAttribute(
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

  test('shows the frame regions: sub-navigation, export, four cards, one filter row', async ({
    page,
  }) => {
    await openOrders(page, ['Orders.View']);
    await page.getByRole('link', { name: '#AS-20400' }).waitFor();

    const nav = page.getByRole('navigation', { name: copy.subNavLabel });

    await expect(nav.getByRole('link', { name: copy.subNav.all })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav.getByText(copy.subNav.payments)).toBeVisible();
    await expect(page.getByRole('button', { name: copy.export })).toBeDisabled();

    const cards = page.getByRole('region', { name: copy.kpiLabel });

    await expect(cards.getByText('23')).toBeVisible();
    await expect(cards.getByText('7', { exact: true })).toBeVisible();
    await expect(cards.getByText('12')).toBeVisible();
    await expect(cards.getByText('18')).toBeVisible();
    await expect(page.getByRole('combobox', { name: copy.statusFilter })).toBeVisible();
  });

  test('the status select writes the status to the URL and asks the API for it', async ({
    page,
  }) => {
    await openOrders(page, ['Orders.View']);
    await page.getByRole('link', { name: '#AS-20400' }).waitFor();

    const request = page.waitForRequest(
      (item) =>
        item.url().includes('/api/v1/admin/orders?') && item.url().includes('status=Shipped'),
    );

    await page.getByRole('combobox', { name: copy.statusFilter }).selectOption('Shipped');
    await request;
    await expect(page).toHaveURL(/status=Shipped/);
  });

  test('an unknown status in the URL does not break the page', async ({ page }) => {
    await openOrders(page, ['Orders.View']);
    await page.goto('/admin/orders?status=Bogus');

    await expect(page.getByRole('link', { name: '#AS-20400' })).toBeVisible();
  });

  test('without Orders.View the page shows the 403 screen', async ({ page }) => {
    await openOrders(page, []);

    await expect(page.getByRole('heading', { name: messages.admin.forbidden.title })).toBeVisible();
    await expect(page.getByRole('link', { name: '#AS-20400' })).toHaveCount(0);
  });
});
