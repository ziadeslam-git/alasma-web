import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Task 84: the guest mobile menu (up to 1000px) offers login and register at the top and no account link: a guest has no
// account to open. (The signed-in menu, with the account link and logout at the bottom, is in mobile-drawer-real-api.)
test('the guest mobile menu has login and register but no account link', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-1280', 'the menu button exists only up to 1000px');
  await page.goto('/');
  await page.getByRole('button', { name: messages.site.header.menu }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await expect(dialog.getByRole('link', { name: messages.site.header.login })).toBeVisible();
  await expect(dialog.getByRole('link', { name: messages.site.header.register })).toBeVisible();
  await expect(dialog.getByRole('link', { name: messages.account.title })).toHaveCount(0);
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
