import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import type { components } from '../src/shared/lib/api';
import { formatMoney } from '../src/shared/lib/format';
import { RealScenario, requireRealApi, signIn } from './support/real-api';

// Real-API journey (Task 11, owner only): a cash order appears in the list and its details show what the API sent.
// The scenario cleanup cancels the order it created.
requireRealApi();
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('order list and details show the API order, status, address and amounts', async ({ page }) => {
  await signIn(page);
  const scenario = new RealScenario(page);
  try {
    const { preview } = await scenario.addSeedBook();
    await preview;
    await page.getByRole('radio', { name: messages.checkout.cashOnDelivery }).check();
    const order = await scenario.placeOrder();

    await page.goto('/account/orders');
    await expect(page.getByRole('link', { name: order.orderNumber, exact: true })).toBeVisible();

    const loaded = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === `/api/v1/orders/${order.id}` &&
        r.request().method() === 'GET' &&
        r.ok(),
    );
    await page.goto(`/account/orders/${encodeURIComponent(order.id)}`);
    const details: components['schemas']['OrderDetailsDto'] = await (await loaded).json();

    await expect(page.locator('h1')).toContainText(details.orderNumber);
    await expect(page.getByText(messages.orders.status[details.status]).first()).toBeVisible();
    await expect(page.getByText(details.address.recipientName).first()).toBeVisible();
    // Amounts are shown exactly as the API sent them; the UI computes nothing.
    await expect(page.getByText(formatMoney(details.total), { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: messages.orders.cancel, exact: true }),
    ).toBeVisible();
  } finally {
    await scenario.cleanup();
  }
});
