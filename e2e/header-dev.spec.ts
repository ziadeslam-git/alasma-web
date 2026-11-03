import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3101' });

test('header preview keeps landmarks and fits the viewport', async ({ page }, testInfo) => {
  const imageWarnings: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (/Image with src|Largest Contentful Paint|LCP|either width or height modified/i.test(text)) {
      imageWarnings.push(text);
    }
  });
  await page.goto('/dev/home');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  expect(imageWarnings).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    fullPage: true,
    path: path.join('test-results', 'header-visual', `${testInfo.project.name}.png`),
  });
});
