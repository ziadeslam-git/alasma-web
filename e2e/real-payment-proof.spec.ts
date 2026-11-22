import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import { RealScenario, requireRealApi, signIn } from './support/real-api';

// Real-API journey (Task 11, owner only): a bank-transfer order, then the receipt upload from the success page. The
// isolated API runs with blank Cloudinary settings, so the receipt goes to its local development storage. The order is
// cancelled by the scenario cleanup. A rejection needs an Admin account, so the re-upload after a rejection is not
// driven here (the mock and unit specs cover it).
requireRealApi();
test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

// A 1x1 PNG: a valid image of a few bytes, far below the 5 MB limit.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

test('a transfer order accepts a receipt upload and moves to review', async ({ page }) => {
  await signIn(page);
  const scenario = new RealScenario(page);
  try {
    const { preview } = await scenario.addSeedBook();
    await preview;
    await page.getByRole('radio', { name: messages.checkout.manualTransfer }).check();
    const order = await scenario.placeOrder();

    const form = page.getByRole('form', { name: messages.orders.proofTitle });
    await expect(form).toBeVisible();
    await form
      .getByLabel(messages.orders.proofFile)
      .setInputFiles({ name: 'receipt.png', mimeType: 'image/png', buffer: PNG_1X1 });

    const upload = page.waitForRequest(
      (r) =>
        r.method() === 'POST' &&
        new URL(r.url()).pathname === `/api/v1/orders/${order.id}/payment-proof`,
    );
    const uploaded = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        new URL(r.url()).pathname === `/api/v1/orders/${order.id}/payment-proof`,
    );
    await form.getByRole('button', { name: messages.orders.proofSubmit }).click();
    const request = await upload;
    expect(request.headers()['content-type']).toContain('multipart/form-data');
    // The amount is never sent: the API takes the order total.
    expect(request.postData() ?? '').not.toMatch(/name="amount"/);
    expect((await uploaded).status()).toBe(200);

    await expect(page.getByText(messages.orders.proofReceived)).toBeVisible();
    await expect(form).toBeHidden();

    await page.goto(`/account/orders/${encodeURIComponent(order.id)}`);
    await expect(page.getByText(messages.orders.proofReceived)).toBeVisible();
    await expect(page.getByText(messages.orders.status.PaymentReview).first()).toBeVisible();
  } finally {
    await scenario.cleanup();
  }
});
