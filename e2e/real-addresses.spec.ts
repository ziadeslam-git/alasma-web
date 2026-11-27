import { expect, test, type Page } from '@playwright/test';
import messages from '../src/i18n/messages/ar.json';
import { requireRealApi, signIn } from './support/real-api';

// Real-API journey (Task 11, owner only): add, edit and delete an address on /account/addresses. The spec deletes only
// the address it created (found by its unique recipient name).
requireRealApi();
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

async function deleteCard(page: Page, name: string) {
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name, exact: true }),
  });
  if ((await card.count()) === 0) return;
  await card.getByRole('button', { name: messages.addresses.delete, exact: true }).click();
  await page
    .getByRole('dialog', { name: messages.addresses.delete })
    .getByRole('button', { name: messages.addresses.delete, exact: true })
    .click();
  await expect(card).toHaveCount(0);
}

test('an address can be added, edited and deleted', async ({ page }) => {
  await signIn(page);
  const name = `E2E ${Date.now()}`;
  const edited = `${name} edited`;
  let currentName = name;
  try {
    await page.goto('/account/addresses');
    await expect(page.locator('h1')).toContainText(messages.addresses.title);
    await page.getByRole('button', { name: messages.addresses.add, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: messages.addresses.add });
    await dialog.getByLabel(messages.addresses.recipientName).fill(name);
    await dialog.getByLabel(messages.addresses.phone).fill('01000000000');
    await dialog.getByLabel(messages.addresses.city).fill('E2E');
    await dialog.getByLabel(messages.addresses.addressLine).fill('E2E street');
    const zone = dialog.getByLabel(messages.addresses.shippingZoneId);
    await expect.poll(() => zone.locator('option').count()).toBeGreaterThan(1);
    await zone.selectOption({ index: 1 });
    await dialog.getByRole('button', { name: messages.addresses.save, exact: true }).click();
    const card = page.locator('article').filter({
      has: page.getByRole('heading', { name, exact: true }),
    });
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: messages.addresses.edit, exact: true }).click();
    const editDialog = page.getByRole('dialog', { name: messages.addresses.edit });
    await editDialog.getByLabel(messages.addresses.recipientName).fill(edited);
    currentName = edited;
    await editDialog.getByRole('button', { name: messages.addresses.save, exact: true }).click();
    await expect(
      page
        .locator('article')
        .filter({ has: page.getByRole('heading', { name: edited, exact: true }) }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
  } finally {
    await page.goto('/account/addresses');
    await deleteCard(page, currentName);
  }
});
