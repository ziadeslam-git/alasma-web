import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// The guest mobile menu (up to 1000px) opens with three quick tiles (design .mn__tiles): the account tile leads a guest to
// login (register is one link away on the login page), then wishlist and cart; no logout button. (The signed-in menu, whose
// first tile opens the account area, is in mobile-drawer-real-api.)
test('the guest mobile menu opens with the account tile to login, wishlist and cart tiles', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-1280', 'the menu button exists only up to 1000px');
  await page.goto('/');
  await page.getByRole('button', { name: messages.site.header.menu }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await expect(dialog.getByRole('link', { name: messages.account.title })).toHaveAttribute(
    'href',
    '/login',
  );
  await expect(dialog.getByText(messages.site.header.wishlist)).toBeVisible();
  await expect(dialog.getByText(messages.site.header.cart)).toBeVisible();
  await expect(dialog.getByRole('button', { name: messages.account.logout })).toHaveCount(0);
});

test('the menu closes when one of its links is used', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-1280', 'the menu button exists only up to 1000px');
  await page.goto('/');
  await page.getByRole('button', { name: messages.site.header.menu }).click();
  await page.getByRole('dialog').getByRole('link', { name: messages.site.header.store }).click();
  await expect(page).toHaveURL(/\/books/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
