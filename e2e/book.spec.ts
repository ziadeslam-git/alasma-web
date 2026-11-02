import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

const invalidPaths = [
  '/books/a%2Fb',
  '/books/a%5Cb',
  `/books/${'a'.repeat(351)}`,
  `/authors/${'a'.repeat(201)}`,
  `/categories/${'a'.repeat(201)}`,
  '/pages/About',
];

for (const path of invalidPaths) {
  test(`invalid segment displays the branded 404: ${path}`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole('heading', { level: 1, name: messages.site.footer.notFoundTitle }),
    ).toBeVisible();
    await expect(page.getByText(messages.site.footer.notFoundDescription)).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: messages.site.header.home }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > globalThis.innerWidth),
    ).toBe(false);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('malformed encoding is rejected by the framework or displays the branded 404', async ({
  page,
}) => {
  const response = await page.goto('/books/%E0%A4%A');

  expect([400, 404]).toContain(response?.status());
  if (response?.status() === 404) {
    await expect(
      page.getByRole('heading', { name: messages.site.footer.notFoundTitle }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  }
});
