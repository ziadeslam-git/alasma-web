import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import { requireRealApi } from './support/real-api';

requireRealApi();
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('the seeded catalog can be browsed from the storefront', async ({ page }) => {
  await page.goto('/');
  for (const heading of [messages.home.featured.heading, messages.home.newArrivals.heading]) {
    const section = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: heading }) });
    await expect(section.locator('a[href^="/books/"]').first()).toBeVisible();
    await expect(section.locator('img').first()).toBeVisible();
  }

  await page.goto('/books');
  const books = page.locator('main a[href^="/books/"]');
  await expect(books.first()).toBeVisible();
  await page
    .getByRole('combobox', { name: messages.catalog.filters.sort.label })
    .selectOption('title');
  await expect(page).toHaveURL(/[?&]sort=title/);
  await books.first().click();
  await expect(page.locator('h1')).toBeVisible();
  const author = page.locator('main a[href^="/authors/"]').first();
  await expect(author).toBeVisible();
  await author.click();
  await expect(page.locator('h1')).toBeVisible();

  await page.goto('/pages/about');
  await expect(page.locator('main p').first()).toBeVisible();
  const missing = await page.goto('/books/real-api-unknown-slug-not-a-book');
  expect(missing?.status()).toBe(404);
});
