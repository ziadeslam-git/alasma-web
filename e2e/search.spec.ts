import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';

test('search query displays book results tabs', async ({ page }) => {
  await page.goto('/books?q=book');
  const tabs = page.getByRole('navigation', { name: messages.search.title });
  await expect(tabs).toBeVisible();
  await expect(tabs.getByText(messages.search.books)).toHaveAttribute('aria-current', 'page');
  for (const key of ['search-tab-authors', 'search-tab-events']) {
    const gate = tabs.locator(`[data-feature="${key}"]`);
    await expect(gate).toHaveAttribute('inert', '');
    await expect(gate.locator('a,button,input')).toHaveCount(0);
  }
});
