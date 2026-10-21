import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Smoke test of the three e-mail recovery pages, opened with no API behind them (the pages make no request on
// load except confirm-email, which is blocked here). Form submissions are not exercised. Runs at the 3 viewports.
const pages = ['/forgot-password', '/reset-password', '/confirm-email'];

for (const path of pages) {
  test(`${path} renders one h1 and has no accessibility violations`, async ({ page }) => {
    // the confirm page posts its token once on load: answer it locally so no backend is needed
    await page.route('**/api/v1/auth/**', (route) => route.abort());

    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}
