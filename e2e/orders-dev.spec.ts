import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });
for (const state of ['list', 'detail', 'locked', 'zone-locked']) {
  test(`orders preview ${state} has one heading, no overflow and passes axe`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/dev/orders?state=${state}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      fullPage: true,
      path: path.join('test-results', 'orders-visual', `${state}-${testInfo.project.name}.png`),
    });
  });
}
