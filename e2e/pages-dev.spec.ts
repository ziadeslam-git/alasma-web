import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });
test('CMS preview has one heading, no overflow and passes axe', async ({ page }, testInfo) => {
  for (const state of ['normal', 'xss', 'plain', 'long', 'empty', 'title-only']) {
    await page.goto(`/dev/page-cms?state=${state}`);
    await expect(page.locator('h1')).toHaveCount(1);
    // The attack fixture sets document.title if any of its script or handlers ran.
    expect(await page.title()).not.toBe('pwned');
    await expect(
      page.locator('main script, main iframe, main [onclick], main [onerror]'),
    ).toHaveCount(0);
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
