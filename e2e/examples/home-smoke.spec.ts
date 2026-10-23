import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// EXAMPLE (task F1.6): smoke test of the home page at the three viewports. Replaced by real flows later.
test('home page answers 200, is Arabic RTL and has no accessibility violations', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await expect(page.locator('h1')).toHaveCount(1);

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
