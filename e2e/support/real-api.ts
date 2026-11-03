import { expect, test, type Page, type Response } from '@playwright/test';

import messages from '../../src/i18n/messages/ar.json';
import type { components } from '../../src/shared/lib/api';

type Order = components['schemas']['OrderDetailsDto'];
type Address = components['schemas']['AddressDto'];

// The isolated API must already be running. Do not start, seed, or modify it here.
export function requireRealApi() {
  test.skip(process.env.E2E_REAL_API !== '1', 'Set E2E_REAL_API=1 to run real-API specs.');
  test.skip(
    !process.env.E2E_CUSTOMER_EMAIL || !process.env.E2E_CUSTOMER_PASSWORD,
    'Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD to run real-API specs.',
  );
}

export async function signIn(page: Page) {
  const email = process.env.E2E_CUSTOMER_EMAIL;
  const password = process.env.E2E_CUSTOMER_PASSWORD;
  if (!email || !password) throw new Error('Real API credentials are missing.');

  await page.goto('/login');
  try {
    await page.getByLabel(messages.auth.email, { exact: true }).fill(email);
    await page.getByLabel(messages.auth.password, { exact: true }).fill(password);
  } catch {
    throw new Error('Unable to fill the real API login form.');
  }
  await page.getByRole('button', { name: messages.auth.login, exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

export class RealScenario {
  private isCartOwned = false;
  private orderId: string | undefined;
  private createdAddressName: string | undefined;
  private readonly pending: Promise<void>[] = [];
  private readonly record = (response: Response) => {
    const path = new URL(response.url()).pathname;
    if (response.request().method() === 'POST' && path === '/api/v1/orders' && response.ok()) {
      this.pending.push(
        response.json().then((order: Order) => {
          this.orderId = order.id;
        }),
      );
    }
  };

  constructor(private readonly page: Page) {
    page.on('response', this.record);
  }

  async addSeedBook() {
    const page = this.page;
    await page.goto('/cart');
    // Never clear someone else's cart. Use an isolated customer with an empty cart.
    await expect(page.getByRole('heading', { name: messages.cart.empty })).toBeVisible();
    await page.goto('/books');
    const badge = page.getByRole('button', { name: messages.site.header.cart, exact: true });
    const before = await badge.innerText();
    await page.locator('main a[href^="/books/"]').first().click();
    this.isCartOwned = true;
    await page
      .getByRole('button', {
        name: new RegExp(messages.catalog.addToCart.split('{title}')[0] ?? ''),
      })
      .first()
      .click();
    await expect(badge).not.toHaveText(before);
    await page.goto('/cart');
    const addresses = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === '/api/v1/me/addresses' &&
        r.request().method() === 'GET' &&
        r.ok(),
    );
    const methods = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/v1/payment-methods' && r.ok(),
    );
    const preview = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/v1/checkout/preview' && r.ok(),
    );
    void methods.catch(() => undefined);
    void preview.catch(() => undefined);
    await page.getByRole('link', { name: messages.cart.checkout }).click();
    await expect(page).toHaveURL(/\/checkout(?:\?|$)/);
    const saved: Address[] = await (await addresses).json();
    if (!saved.length) {
      const name = `E2E ${Date.now()}`;
      this.createdAddressName = name;
      await page.getByLabel(messages.addresses.recipientName).fill(name);
      await page.getByLabel(messages.addresses.phone).fill('01000000000');
      await page.getByLabel(messages.addresses.city).fill('E2E');
      await page.getByLabel(messages.addresses.addressLine).fill('E2E');
      const zone = page.getByLabel(messages.addresses.shippingZoneId);
      await expect.poll(() => zone.locator('option').count()).toBeGreaterThan(1);
      await zone.selectOption({ index: 1 });
      await page.getByRole('button', { name: messages.addresses.save, exact: true }).click();
    }
    return { preview, methods };
  }

  async placeOrder() {
    const response = this.page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === '/api/v1/orders' && r.request().method() === 'POST' && r.ok(),
    );
    await this.page
      .getByRole('button', { name: messages.checkout.placeOrder, exact: true })
      .click();
    const order: Order = await (await response).json();
    this.orderId = order.id;
    this.isCartOwned = false;
    await expect(this.page).toHaveURL(new RegExp(`/checkout/success/${order.id}`));
    return order;
  }

  async cleanup() {
    await Promise.allSettled(this.pending);
    this.page.off('response', this.record);
    const errors: unknown[] = [];
    const attempt = async (action: () => Promise<void>) => {
      try {
        await action();
      } catch (error) {
        errors.push(error);
      }
    };
    const orderId = this.orderId;
    if (orderId)
      await attempt(async () => {
        const response = this.page.waitForResponse(
          (r) => new URL(r.url()).pathname === `/api/v1/orders/${orderId}` && r.ok(),
        );
        await this.page.goto(`/account/orders/${encodeURIComponent(orderId)}`);
        await response;
        const cancel = this.page.getByRole('button', { name: messages.orders.cancel, exact: true });
        await expect(cancel).toBeVisible();
        await cancelCurrentOrder(this.page);
      });
    if (this.isCartOwned)
      await attempt(async () => {
        await this.page.goto('/cart');
        const clear = this.page.getByRole('button', { name: messages.cart.clear, exact: true });
        await expect(
          clear.or(this.page.getByRole('heading', { name: messages.cart.empty })),
        ).toBeVisible();
        if (await clear.isVisible()) {
          await clear.click();
          await this.page
            .getByRole('dialog')
            .getByRole('button', { name: messages.cart.confirmClear })
            .click();
          await expect(this.page.getByRole('heading', { name: messages.cart.empty })).toBeVisible();
        }
      });
    if (this.createdAddressName)
      await attempt(async () => {
        const response = this.page.waitForResponse(
          (r) =>
            new URL(r.url()).pathname === '/api/v1/me/addresses' &&
            r.request().method() === 'GET' &&
            r.ok(),
        );
        await this.page.goto('/account/addresses');
        const addresses: Address[] = await (await response).json();
        if (!addresses.some((address) => address.recipientName === this.createdAddressName)) return;
        const card = this.page.locator('article').filter({
          has: this.page.getByRole('heading', { name: this.createdAddressName, exact: true }),
        });
        {
          await expect(card).toBeVisible();
          await card.getByRole('button', { name: messages.addresses.delete, exact: true }).click();
          await this.page
            .getByRole('dialog', { name: messages.addresses.confirmDelete })
            .getByRole('button', { name: messages.addresses.delete, exact: true })
            .click();
          await expect(card).toHaveCount(0);
        }
      });
    if (errors.length) throw new AggregateError(errors, 'Real API cleanup failed');
  }
}

export async function cancelCurrentOrder(page: Page) {
  await page.getByRole('button', { name: messages.orders.cancel, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: messages.orders.confirmCancel });
  await dialog.getByRole('button', { name: messages.orders.cancel, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(messages.orders.status.Cancelled).first()).toBeVisible();
}
