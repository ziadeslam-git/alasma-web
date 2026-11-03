import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });

for (const state of ['loading', 'empty', 'ok', 'error', 'unavailable']) {
  test(`checkout fixture: ${state}`, async ({ page }, testInfo) => {
    await page.goto(`/dev/checkout?state=${state}`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`checkout-visual/${state}.png`),
      fullPage: true,
    });
  });
}
