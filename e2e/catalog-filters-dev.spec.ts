import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';

// Dev-only page (404 in production), so this runs against the next dev server on port 3101 like catalog-dev.spec.ts.
test.use({ baseURL: 'http://localhost:3101' });

const text = messages.catalog.filters;
const fixtures = messages.devCatalogFilters.fixtures;
const PAGE = '/dev/catalog-filters';
const FILTER_DRAWER_MAX_WIDTH = 1000;

const manyUrl = `${PAGE}?category=mystery&author=sami-alhakim&minPrice=60&maxPrice=350&inStock=true&sort=price_asc&page=2`;

const isFilterDrawer = (page: Page) =>
  (page.viewportSize()?.width ?? 1280) <= FILTER_DRAWER_MAX_WIDTH;
const search = (page: Page) => new URL(page.url()).searchParams;

async function expectNoOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(hasOverflow).toBe(false);
}

test('many filters: selected state comes from the URL, a change rewrites it and resets the page', async ({
  page,
}) => {
  const response = await page.goto(manyUrl);

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveCount(1);
  await expectNoOverflow(page);

  // The chips and the normalized URL always show the state, on every width.
  const chips = page.getByRole('region', { name: text.chips.label });
  await expect(chips.getByText(fixtures.mystery)).toBeVisible();
  await expect(chips.getByText(fixtures.authorOne)).toBeVisible();
  await expect(page.getByTestId('normalized-url')).toHaveText(manyUrl);
  await expect(page.getByRole('combobox', { name: text.sort.label })).toHaveValue('price_asc');
  await expect(page.getByRole('link', { name: fixtures.fiction, exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );

  if (isFilterDrawer(page)) {
    await expect(page.getByRole('complementary', { name: text.panelLabel })).toBeHidden();

    const trigger = page.getByRole('button', { name: text.openWithCount.replace('{count}', '4') });
    await expect(trigger).toBeVisible();
    await expect(page.getByTestId('filter-count')).toHaveText('4');
    await expectNoOverflow(page);

    await trigger.click();
    const dialog = page.getByRole('dialog', { name: text.title });
    await expect(dialog).toBeVisible();
    await expectNoOverflow(page);
    await expect(dialog.getByRole('radio', { name: fixtures.mystery })).toBeChecked();

    // Focus is trapped in the sheet.
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

    const axeOpen = await new AxeBuilder({ page }).analyze();
    expect(axeOpen.violations).toEqual([]);

    // The sheet works on a draft: the URL does not change until "apply".
    await dialog.getByRole('checkbox', { name: text.groups.hasDiscount }).check();
    expect(search(page).get('hasDiscount')).toBeNull();
    await dialog.getByRole('button', { name: text.apply }).click();

    await expect(dialog).toBeHidden();
    await expect.poll(() => search(page).get('hasDiscount')).toBe('true');
    expect(search(page).get('page')).toBeNull();
    expect(search(page).get('category')).toBe('mystery');
    const updatedTrigger = page.getByRole('button', {
      name: text.openWithCount.replace('{count}', '5'),
    });
    await expect(updatedTrigger).toBeFocused();
    await expect(page.getByTestId('filter-count')).toHaveText('5');
  } else {
    const panel = page.getByRole('complementary', { name: text.panelLabel });
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('filter-count')).toBeHidden();
    await expect(panel.getByRole('radio', { name: fixtures.mystery })).toBeChecked();
    await expect(panel.getByRole('radio', { name: fixtures.authorOne })).toBeChecked();
    await expect(panel.getByRole('checkbox', { name: text.groups.inStock })).toBeChecked();
    await expect(panel.getByRole('textbox', { name: text.groups.priceMin })).toHaveValue('60');
    await expect(panel.getByRole('textbox', { name: text.groups.priceMax })).toHaveValue('350');

    await panel.getByRole('checkbox', { name: text.groups.hasDiscount }).click();

    await expect.poll(() => search(page).get('hasDiscount')).toBe('true');
    expect(search(page).get('page')).toBeNull();
    expect(search(page).get('category')).toBe('mystery');
    await expect(panel.getByRole('checkbox', { name: text.groups.hasDiscount })).toBeChecked();
    await expect(chips.getByText(text.chips.hasDiscount)).toBeVisible();

    // Soon groups are dimmed and inert, with the badge.
    const soonGroup = panel.locator('[data-feature="filter-rating"]');
    await expect(soonGroup).toHaveAttribute('inert', '');
    await expect(soonGroup).toContainText(messages.site.soon);
  }

  await expectNoOverflow(page);
  const axeResults = await new AxeBuilder({ page }).analyze();
  expect(axeResults.violations).toEqual([]);
});

test('an empty URL shows the defaults and no chips', async ({ page }) => {
  await page.goto(PAGE);

  await expect(page.getByRole('region', { name: text.chips.label })).toHaveCount(0);
  await expect(page.getByTestId('normalized-url')).toHaveText(PAGE);
  await expect(page.getByRole('combobox', { name: text.sort.label })).toHaveValue('newest');
  await expect(page.getByRole('link', { name: text.categoryNav.all, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('invalid values are dropped from the state and nothing breaks', async ({ page }) => {
  const invalid = `${PAGE}?category=${encodeURIComponent('javascript:alert(1)')}&minPrice=-5&maxPrice=abc&sort=popular&page=0&inStock=yes&unknown=1`;
  const response = await page.goto(invalid);

  expect(response?.status()).toBe(200);
  await expect(page.getByTestId('normalized-url')).toHaveText(PAGE);
  await expect(page.getByRole('region', { name: text.chips.label })).toHaveCount(0);
  await expectNoOverflow(page);
});

test('an Arabic slug round-trips through the URL and selects its option', async ({ page }) => {
  await page.goto(`${PAGE}?category=${encodeURIComponent(fixtures.poetry)}`);

  await expect(page.getByRole('link', { name: fixtures.poetry, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    page.getByRole('region', { name: text.chips.label }).getByText(fixtures.poetry),
  ).toBeVisible();
  await expect(page.getByTestId('normalized-url')).toHaveText(
    `${PAGE}?category=${encodeURIComponent(fixtures.poetry)}`,
  );
  await expectNoOverflow(page);
});

test('the sort select, the price range and the chips rewrite the URL', async ({ page }) => {
  await page.goto(`${PAGE}?category=novels&page=3`);

  await page.getByRole('combobox', { name: text.sort.label }).selectOption('price_desc');
  await expect.poll(() => search(page).get('sort')).toBe('price_desc');
  expect(search(page).get('page')).toBeNull();
  expect(search(page).get('category')).toBe('novels');

  if (!isFilterDrawer(page)) {
    const panel = page.getByRole('complementary', { name: text.panelLabel });
    const min = panel.getByRole('textbox', { name: text.groups.priceMin });

    // An invalid number shows the Arabic error and does not touch the URL.
    await min.fill('abc');
    await min.blur();
    await expect(panel.getByText(text.errors.priceInvalid)).toBeVisible();
    expect(search(page).get('minPrice')).toBeNull();

    // A valid one is applied after the debounce.
    await min.fill('60');
    await expect.poll(() => search(page).get('minPrice')).toBe('60');
    await expect(panel.getByText(text.errors.priceInvalid)).toHaveCount(0);
  }

  // Removing a chip is a real link.
  const chips = page.getByRole('region', { name: text.chips.label });
  await chips
    .getByRole('link', { name: text.chips.remove.replace('{label}', fixtures.fiction) })
    .click();
  await expect.poll(() => search(page).get('category')).toBeNull();
  expect(search(page).get('sort')).toBe('price_desc');

  await expectNoOverflow(page);
});
