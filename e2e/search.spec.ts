import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';

// Task 76: the authors and events tabs are hidden until their features are live, and a lone "books" tab says nothing,
// so the results page has no tabs row at all.
test('search results show no tabs row while the authors and events tabs are not live', async ({
  page,
}) => {
  await page.goto('/books?q=book');
  await expect(page.getByRole('navigation', { name: messages.search.title })).toHaveCount(0);
  await expect(page.locator('main [data-feature^="search-tab-"]')).toHaveCount(0);
  await expect(page.locator('main [data-soon-badge]')).toHaveCount(0);
});
