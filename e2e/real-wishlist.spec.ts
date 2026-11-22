import { expect, test, type Page } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import { requireRealApi, signIn } from './support/real-api';

// Real-API journey (Task 11, owner only): save a book with the heart, find it on /account/wishlist, remove it. The
// spec removes only the book it saved. Use an isolated customer: a book that is already saved is a setup error.
requireRealApi();
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const togglePrefix = messages.wishlist.toggle.split('{title}')[0] ?? '';

function heart(page: Page) {
  return page.locator('main').getByRole('button', { name: new RegExp(`^${togglePrefix}`) });
}

test('a book can be saved with the heart, listed on the wishlist and removed', async ({ page }) => {
  await signIn(page);
  await page.goto('/books');
  await page.locator('main a[href^="/books/"]').first().click();
  await expect(page.locator('h1')).toBeVisible();
  const title = (await page.locator('h1').innerText()).trim();
  const button = heart(page).first();
  await expect(button).toBeVisible();
  if ((await button.getAttribute('aria-pressed')) === 'true') {
    throw new Error('This book is already in the wishlist: use a customer with an empty wishlist.');
  }

  const saved = page.waitForResponse(
    (r) =>
      r.request().method() === 'PUT' &&
      new URL(r.url()).pathname.startsWith('/api/v1/wishlist/') &&
      r.ok(),
  );
  let isSaved = false;
  try {
    await button.click();
    await saved;
    isSaved = true;
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/account/wishlist');
    await expect(page.locator('h1')).toContainText(messages.wishlist.title);
    await expect(page.getByRole('link', { name: title }).first()).toBeVisible();

    const removed = page.waitForResponse(
      (r) =>
        r.request().method() === 'DELETE' &&
        new URL(r.url()).pathname.startsWith('/api/v1/wishlist/') &&
        r.ok(),
    );
    await page
      .getByRole('button', { name: messages.wishlist.remove.replace('{title}', title) })
      .click();
    await removed;
    isSaved = false;
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  } finally {
    if (isSaved) {
      await page.goto('/account/wishlist');
      const remove = page.getByRole('button', {
        name: messages.wishlist.remove.replace('{title}', title),
      });
      if (await remove.isVisible()) await remove.click();
    }
  }
});
