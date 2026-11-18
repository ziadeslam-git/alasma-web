import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
test.use({ baseURL: 'http://localhost:3101' });
// Task 81: the photo fills its frame edge to edge at every width, and the card keeps its 180px photo height.
test('an author photo fills its frame edge to edge with a 180px height', async ({ page }) => {
  await page.goto('/dev/authors?state=photo');
  const sizes = await page.evaluate(() => {
    const frame = document.querySelector('article span')!.getBoundingClientRect();
    const image = document.querySelector('article img')!.getBoundingClientRect();
    return { frame: frame.width, image: image.width, height: image.height };
  });
  expect(Math.abs(sizes.frame - sizes.image)).toBeLessThanOrEqual(1);
  expect(sizes.height).toBe(180);
});

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
