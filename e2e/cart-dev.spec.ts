import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
test.use({ baseURL: 'http://localhost:3101' });
for (const state of ['empty', 'normal', 'warnings', 'bundle', 'long']) {
  test(`cart preview ${state} is accessible`, async ({ page }, testInfo) => {
    await page.goto(`/dev/cart?state=${state}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      fullPage: true,
      path: path.join('test-results', 'cart-visual', `${state}-${testInfo.project.name}.png`),
    });
  });
}
