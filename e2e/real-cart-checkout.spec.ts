import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import type { components } from '../src/shared/lib/api';
import { formatMoney, formatNumber } from '../src/shared/lib/format';
import { RealScenario, requireRealApi, signIn } from './support/real-api';

requireRealApi();
test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('cash checkout uses the server preview and creates a cancellable order', async ({ page }) => {
  await signIn(page);
  const scenario = new RealScenario(page);
  try {
    const initial = await scenario.addSeedBook();
    const initialPreview: components['schemas']['CheckoutPreviewDto'] = await (
      await initial.preview
    ).json();
    const couponResponse = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === '/api/v1/checkout/preview' &&
        r.request().method() === 'POST' &&
        r.ok(),
    );
    await page.getByLabel(messages.checkout.couponLabel).fill('WELCOME10');
    await page.getByRole('button', { name: messages.checkout.couponApply, exact: true }).click();
    const preview: components['schemas']['CheckoutPreviewDto'] = await (
      await couponResponse
    ).json();
    expect(preview.total).not.toBe(initialPreview.total);
    for (const amount of [
      preview.total,
      preview.subtotal,
      preview.couponDiscount,
      preview.shippingFee,
    ]) {
      await expect(page.getByText(formatMoney(amount), { exact: true }).first()).toBeVisible();
    }
    await page.getByRole('radio', { name: messages.checkout.cashOnDelivery }).check();
    const order = await scenario.placeOrder();
    await page.goto('/account/orders');
    await expect(page.getByRole('link', { name: order.orderNumber, exact: true })).toBeVisible();
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: messages.cart.empty })).toBeVisible();
  } finally {
    await scenario.cleanup();
  }
});

test('manual transfer shows the numbers and expiry supplied by the API', async ({ page }) => {
  await signIn(page);
  const scenario = new RealScenario(page);
  try {
    const { methods: methodsResponse } = await scenario.addSeedBook();
    const methods: components['schemas']['PaymentMethodDto'][] = await (
      await methodsResponse
    ).json();
    const details = methods.find((method) => method.method === 'ManualTransfer')?.details;
    expect(details?.transferNumbers).toHaveLength(2);
    await page.getByRole('radio', { name: messages.checkout.manualTransfer }).check();
    for (const entry of details?.transferNumbers ?? [])
      await expect(page.getByText(entry.number)).toBeVisible();
    if (!details) throw new Error('Manual transfer details are missing.');
    await expect(
      page.getByText(
        messages.checkout.transferExpiry.replace('{hours}', formatNumber(details.expiresInHours)),
      ),
    ).toBeVisible();
  } finally {
    await scenario.cleanup();
  }
});
