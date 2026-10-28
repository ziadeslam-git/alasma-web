import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

const FILTER_DRAWER_MAX_WIDTH = 1000;
const filterText = messages.catalog.filters;

const isFilterDrawer = (page: Page) =>
  (page.viewportSize()?.width ?? 1280) <= FILTER_DRAWER_MAX_WIDTH;

async function expectNoOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);
}

test('/books answers 200, renders RTL catalog layout, has no overflow and passes axe', async ({
  page,
}) => {
  const response = await page.goto('/books');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('combobox', { name: filterText.sort.label })).toHaveValue('newest');

  if (isFilterDrawer(page)) {
    await expect(page.getByRole('complementary', { name: filterText.panelLabel })).toBeHidden();
    await expect(page.getByRole('button', { name: filterText.open })).toBeVisible();
  } else {
    await expect(page.getByRole('complementary', { name: filterText.panelLabel })).toBeVisible();
  }

  await expectNoOverflow(page);
  const axeResults = await new AxeBuilder({ page }).analyze();
  expect(axeResults.violations).toEqual([]);
});

test('/books syncs filters and sorting with the URL and resets page on sort change', async ({
  page,
}) => {
  const response = await page.goto('/books?category=novels&inStock=true&sort=price_asc&page=2');

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);

  const chips = page.getByRole('region', { name: filterText.chips.label });
  await expect(chips).toBeVisible();
  await expect(chips.getByText(filterText.chips.inStock)).toBeVisible();

  const sortSelect = page.getByRole('combobox', { name: filterText.sort.label });
  await expect(sortSelect).toHaveValue('price_asc');

  await sortSelect.selectOption('price_desc');
  await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('price_desc');
  expect(new URL(page.url()).searchParams.get('page')).toBeNull();
  expect(new URL(page.url()).searchParams.get('category')).toBe('novels');

  await expectNoOverflow(page);
  const axeResults = await new AxeBuilder({ page }).analyze();
  expect(axeResults.violations).toEqual([]);
});

test('/books sanitizes invalid and out-of-range query parameters without crashing', async ({
  page,
}) => {
  const response = await page.goto(
    `/books?category=${encodeURIComponent('javascript:alert(1)')}&minPrice=-10&maxPrice=999999999&sort=popular&page=999999`,
  );

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('region', { name: filterText.chips.label })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: filterText.sort.label })).toHaveValue('newest');
  await expectNoOverflow(page);
});
