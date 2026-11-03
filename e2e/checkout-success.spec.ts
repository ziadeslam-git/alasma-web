import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ baseURL: 'http://localhost:3101' });

for (const width of [360, 768, 1280]) {
  for (const state of ['cash', 'manual', 'bundle', 'loading', 'not-found']) {
    test(`order success ${state} at ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/dev/order-success?state=${state}`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`order-success-visual/${state}-${width}.png`),
        fullPage: true,
      });
    });
  }
}
