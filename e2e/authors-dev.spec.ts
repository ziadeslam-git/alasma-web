import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
test.use({ baseURL: 'http://localhost:3101' });
test('authors preview has RTL, a heading and no overflow or accessibility violations', async ({
  page,
}, testInfo) => {
  await page.goto('/dev/authors');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'authors-visual', `${testInfo.project.name}.png`),
  });
});
