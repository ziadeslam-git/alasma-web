import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Dev-only catalog reference page (/dev/catalog returns 404 in production, so this runs against the next dev
// server on port 3101). Checks the column count per viewport, no horizontal overflow, and axe.
test.use({ baseURL: 'http://localhost:3101' });

test('/dev/catalog renders the expected grid columns, has no horizontal overflow and passes axe', async ({
  page,
}) => {
  const response = await page.goto('/dev/catalog');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);

  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const expectedColumns = viewportWidth <= 1000 ? 2 : 4;

  const firstGrid = page.locator('#states-heading + div');
  const columnCount = await firstGrid.evaluate((element) => {
    const template = globalThis.getComputedStyle(element).gridTemplateColumns;

    return template.trim().split(/\s+/).length;
  });
  expect(columnCount).toBe(expectedColumns);
  await expect(firstGrid.locator('article')).toHaveCount(8);

  const ribbonMetrics = await firstGrid
    .getByText('خصم 20%', { exact: true })
    .evaluate((element) => {
      const style = globalThis.getComputedStyle(element);

      return {
        blockSize: style.blockSize,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        inlineSize: style.inlineSize,
        insetBlockStart: style.insetBlockStart,
        insetInlineEnd: style.insetInlineEnd,
        lineHeight: style.lineHeight,
        transform: style.transform,
      };
    });
  expect(ribbonMetrics).toEqual({
    blockSize: '20px',
    fontSize: '10.5px',
    fontWeight: '700',
    inlineSize: '108px',
    insetBlockStart: '15px',
    insetInlineEnd: '-33px',
    lineHeight: '20px',
    transform: expect.stringMatching(/^matrix\(0\.707107,\s*-0\.707107,\s*0\.707107,\s*0\.707107/),
  });

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
