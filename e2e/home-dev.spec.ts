import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Dev-only home reference page (/dev/home returns 404 in production, so this runs against the next dev
// server on port 3101). Checks layout, RTL, single h1, no horizontal overflow, axe, and saves visual QA screenshots.
test.use({ baseURL: 'http://localhost:3101' });

test('/dev/home renders populated state, has no horizontal overflow, passes axe, and saves screenshot', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/dev/home?state=ok');

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
    path: path.join('test-results', 'home-visual', `${testInfo.project.name}.png`),
  });
});

test('/dev/home renders empty and error states without horizontal overflow', async ({ page }) => {
  const emptyResponse = await page.goto('/dev/home?state=empty');
  expect(emptyResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText(messages.home.categories.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.newArrivals.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.featured.emptyTitle)).toBeVisible();

  const emptyOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(emptyOverflow).toBe(false);

  const errorResponse = await page.goto('/dev/home?state=error');
  expect(errorResponse?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText(messages.home.categories.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.newArrivals.emptyTitle)).toBeVisible();
  await expect(page.getByText(messages.home.featured.emptyTitle)).toBeVisible();

  const errorOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(errorOverflow).toBe(false);
});
