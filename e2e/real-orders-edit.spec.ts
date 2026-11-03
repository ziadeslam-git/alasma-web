import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import { RealScenario, requireRealApi, signIn } from './support/real-api';

requireRealApi();
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('edit sends the changed recipient and row version, then cancels the order', async ({
  page,
}) => {
  await signIn(page);
  const scenario = new RealScenario(page);
  try {
    const { preview } = await scenario.addSeedBook();
    await preview;
    await page.getByRole('radio', { name: messages.checkout.cashOnDelivery }).check();
    const order = await scenario.placeOrder();
    await page.goto(`/account/orders/${encodeURIComponent(order.id)}`);
    await page.getByRole('button', { name: messages.orders.edit, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: messages.orders.edit });
    const recipient = dialog.getByLabel(messages.orders.recipientName);
    const changedName = `${await recipient.inputValue()} E2E`;
    await recipient.fill(changedName);
    const request = page.waitForRequest(
      (r) => r.method() === 'PUT' && new URL(r.url()).pathname === `/api/v1/orders/${order.id}`,
    );
    await dialog.getByRole('button', { name: messages.orders.save }).click();
    const body: Record<string, unknown> = (await request).postDataJSON();
    expect(body.recipientName).toBe(changedName);
    expect(body.rowVersion).toBeTruthy();
    expect(Object.keys(body).sort()).toEqual(['recipientName', 'rowVersion'].sort());
    await expect(dialog).toBeHidden();
  } finally {
    await scenario.cleanup();
  }
});
