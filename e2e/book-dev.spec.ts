import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Dev-only book reference page (/dev/book returns 404 in production, so this runs against the next dev
// server on port 3101). Checks layout, RTL, single h1, no horizontal overflow, axe, and saves visual QA screenshots.
test.use({ baseURL: 'http://localhost:3101' });

test('/dev/book renders populated state, has no horizontal overflow, passes axe, and saves screenshot', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/dev/book');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'book-visual', `${testInfo.project.name}.png`),
  });
});

test('/dev/book renders discounted, out-of-stock, and empty description states without horizontal overflow', async ({
  page,
}) => {
  const discountedResponse = await page.goto('/dev/book?state=discounted');
  expect(discountedResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText('وفّر 25%')).toBeVisible();

  const discountedOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(discountedOverflow).toBe(false);

  const outOfStockResponse = await page.goto('/dev/book?state=out-of-stock');
  expect(outOfStockResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText(messages.catalog.detail.stock.outOfStock)).toBeVisible();

  const outOfStockOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(outOfStockOverflow).toBe(false);

  const noDescResponse = await page.goto('/dev/book?state=no-description');
  expect(noDescResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText(messages.catalog.detail.description.emptyTitle)).toBeVisible();

  const noDescOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(noDescOverflow).toBe(false);
});
