import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });
test('CMS preview has one heading, no overflow and passes axe', async ({ page }, testInfo) => {
  for (const state of ['normal', 'long', 'empty', 'title-only']) {
    await page.goto(`/dev/page-cms?state=${state}`);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'pages-visual', `${testInfo.project.name}.png`),
  });
});
