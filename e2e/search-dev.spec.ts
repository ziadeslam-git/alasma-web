import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';

test.use({ baseURL: 'http://localhost:3101' });
test('search preview preserves keyboard access and RTL', async ({ page }, testInfo) => {
  await page.goto('/dev/search');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);
  for (const state of [
    messages.search.idle,
    messages.search.loading,
    messages.search.books,
    messages.search.empty,
    messages.search.error,
  ]) {
    await expect(
      page.getByRole('search', { name: `${messages.site.search.label} - ${state}` }),
    ).toHaveCount(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const trigger = page.getByRole('searchbox', { name: messages.site.search.label }).first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: messages.search.title })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'search-visual', `${testInfo.project.name}.png`),
  });
});
