import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Dev-only catalog page reference (/dev/books returns 404 in production, so this runs against next dev on port 3101).
// Verifies populated grid, pagination, empty, invalid (400) and error (500) states, axe, and saves screenshots.
test.use({ baseURL: 'http://localhost:3101' });

const pageText = messages.catalog.page;

test('/dev/books renders populated catalog, pagination, passes axe and saves screenshot', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/dev/books');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByTestId('catalog-result-count')).toContainText('24');
  await expect(page.locator('article')).toHaveCount(8);

  const pagination = page.getByRole('navigation', { name: pageText.pagination.label });
  await expect(pagination).toBeVisible();
  await expect(pagination.getByRole('link', { name: '2' })).toHaveAttribute(
    'href',
    '/dev/books?page=2',
  );

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'books-visual', `${testInfo.project.name}.png`),
  });
});

test('/dev/books renders empty, invalid (400) and error (500) states without overflow', async ({
  page,
}) => {
  const emptyRes = await page.goto('/dev/books?state=empty&category=novels');
  expect(emptyRes?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { level: 2, name: pageText.filteredEmptyTitle }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: pageText.resetFilters })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
  ).toBe(false);

  const invalidRes = await page.goto('/dev/books?state=invalid');
  expect(invalidRes?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { level: 2, name: pageText.invalidFiltersTitle }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: pageText.resetFilters })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
  ).toBe(false);

  const errorRes = await page.goto('/dev/books?state=error');
  expect(errorRes?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 2, name: pageText.errorTitle })).toBeVisible();
  await expect(page.getByRole('link', { name: pageText.retry })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
  ).toBe(false);
});
