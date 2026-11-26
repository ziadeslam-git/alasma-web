import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Task 76: catalog, home and search polish, and the unfinished features that are hidden. Three blocks:
//  - "dev previews": /dev pages (they return 404 in a production build), so they run against `next dev` on 3101;
//  - "without the API": pages and the search overlay that need no API (the overlay's requests are mocked with page.route);
//  - "with the real API": real data; E2E_POLISH_ORIGIN points it at a production build on its own port.
// E2E_CAPTURE_DIR, when set, writes a screenshot per check (outside the repo: Playwright wipes test-results/).
const captureDir = process.env.E2E_CAPTURE_DIR;
const WIDTHS = [360, 768, 1280] as const;
const DEV_ORIGIN = 'http://localhost:3101';

test.beforeEach(async ({ page }) => {
  if (captureDir) {
    // pictures only: the intro splash is a cookie, and covers the first page of every session in a production build
    await page.addInitScript(() => {
      document.cookie = 'alasma-splash-seen=1; Path=/; SameSite=Lax';
    });
  }
});

// Task 78: every check that passed also leaves an axe-clean page (the state the check ended in). It runs before the
// picture hook, which injects a style tag. The Next dev overlay portal (dev previews only) is not part of the page.
test.afterEach(async ({ page }, testInfo) => {
  if (
    testInfo.status !== testInfo.expectedStatus ||
    testInfo.status === 'skipped' ||
    page.isClosed()
  )
    return;
  if (page.url() === 'about:blank') return;
  const results = await new AxeBuilder({ page }).exclude('nextjs-portal').analyze();
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`),
  ).toEqual([]);
});

// One picture per test, named after the test, also when the test failed (a failing "before" run is the "before" picture).
test.afterEach(async ({ page }, testInfo) => {
  if (!captureDir || page.isClosed()) return;
  const name = testInfo.title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try {
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await page.screenshot({
      fullPage: !testInfo.title.includes('search overlay'),
      path: path.join(captureDir, `${name}.png`),
    });
  } catch {
    // a closed or crashed page just has no picture
  }
});

const onlyDesktopProject = (testInfo: { project: { name: string } }) =>
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');

// the number of grid columns of the element that holds the book cards
async function bookGridColumns(page: Page) {
  return page.evaluate(() => {
    let element: HTMLElement | null = document.querySelector('main a[href^="/books/"]');
    while (element && element !== document.body) {
      element = element.parentElement;
      if (!element) break;
      const style = getComputedStyle(element);
      if (style.display === 'grid' && style.gridTemplateColumns.split(' ').length > 1) {
        return style.gridTemplateColumns.split(' ').length;
      }
    }
    return 0;
  });
}

// gap in px between the bottom of the first element and the top of the next element in the document
const gapBelow = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const element = document.querySelector(sel)!;
    const next = element.nextElementSibling!;
    return Math.round(next.getBoundingClientRect().top - element.getBoundingClientRect().bottom);
  }, selector);

test.describe('dev previews', () => {
  test.use({ baseURL: DEV_ORIGIN });

  for (const width of WIDTHS) {
    test(`A2 the ISBN value is aligned like the other values, not left-pinned (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/book?state=out-of-stock');
      const rows = await page.locator('table tr').evaluateAll((trs) =>
        trs.map((tr) => {
          const cell = tr.querySelector('td')!;
          const range = document.createRange();
          range.selectNodeContents(cell);
          return {
            label: tr.querySelector('th')!.textContent,
            textRight: Math.round(range.getBoundingClientRect().right),
            hasDirOnCell: cell.hasAttribute('dir'),
          };
        }),
      );
      expect(rows.length).toBeGreaterThan(2);
      expect(rows.some((row) => row.label === messages.catalog.detail.specs.isbn)).toBe(true);
      // every value starts at the same inline-start edge, ISBN included, and no cell carries dir itself
      expect(new Set(rows.map((row) => row.textRight)).size, JSON.stringify(rows)).toBe(1);
      expect(rows.some((row) => row.hasDirOnCell)).toBe(false);
    });

    test(`B out of stock keeps the label and hides the notify-me action (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/book?state=out-of-stock');
      await expect(page.getByText(messages.catalog.detail.stock.outOfStock)).toBeVisible();
      await expect(page.locator('[data-feature="reservations-notify-me"]')).toHaveCount(0);
      await expect(page.getByText(messages.catalog.detail.actions.notifyMe)).toHaveCount(0);
    });

    test(`B the store hides the unfinished filter rows and the facet note (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/books');
      await expect(page.locator('main [data-feature^="filter-"]')).toHaveCount(0);
      // the filter sidebar has nothing dimmed left (the cards' own wishlist heart is a different feature)
      await expect(page.getByRole('complementary').locator('[data-soon-badge]')).toHaveCount(0);
      for (const label of [
        messages.catalog.filters.groups.language,
        messages.catalog.filters.groups.coverType,
        messages.catalog.filters.groups.rating,
        messages.catalog.filters.facetCountsNote,
      ]) {
        await expect(page.getByText(label)).toHaveCount(0);
      }
    });

    test(`A10 an author without a photo shows initials, not a blank block (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/authors');
      const card = page.locator('main article').first();
      const initials = card.locator('[data-author-initials]');
      await expect(initials).toBeVisible();
      await expect(initials).toHaveAttribute('aria-hidden', 'true');
      expect((await initials.textContent())!.trim().length).toBeGreaterThan(0);
      expect((await initials.textContent())!.trim().length).toBeLessThanOrEqual(2);
      await expect(card.locator('[role="img"]')).toHaveCount(0);
      // the accessible name of the link stays the author's name
      await expect(card.getByRole('link')).toHaveAccessibleName(/\S/);
    });

    test(`A9 headings keep a normal distance from their content (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/authors');
      expect(await gapBelow(page, 'main h1'), '/authors h1').toBeGreaterThanOrEqual(20);

      await page.goto('/dev/categories?state=empty');
      expect(await gapBelow(page, 'main h1'), 'empty categories h1').toBeGreaterThanOrEqual(20);

      await page.goto('/dev/authors?state=detail');
      const gaps = await page.evaluate(() => {
        const profile = document.querySelector('main h1')!.closest('div')!.parentElement!;
        const section = document.querySelector('main section')!;
        const h2 = section.querySelector('h2')!;
        const link = section.querySelector('a[href^="/books?author"]')!;
        const crumbs = document.querySelector('main nav')!;
        const top = (e: Element) => e.getBoundingClientRect().top;
        const bottom = (e: Element) => e.getBoundingClientRect().bottom;
        return {
          crumbsToProfile: Math.round(top(profile) - bottom(crumbs)),
          profileToSection: Math.round(top(section) - bottom(profile)),
          // the "view all" link is a real button-like link: it has a visible border
          viewAllBorder: getComputedStyle(link).borderBlockStartWidth,
          h2ToNext: Math.round(top(h2.nextElementSibling!) - bottom(h2)),
        };
      });
      expect(gaps.crumbsToProfile).toBeGreaterThanOrEqual(20);
      expect(gaps.profileToSection).toBeGreaterThanOrEqual(20);
      expect(gaps.h2ToNext).toBeGreaterThanOrEqual(16);
      expect(gaps.viewAllBorder).not.toBe('0px');
    });
  }

  for (const width of [761, 800, 1000] as const) {
    test(`C1 the store grid has 3 columns at ${width}px`, async ({ page }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/books');
      expect(await bookGridColumns(page)).toBe(3);
    });
  }

  test('C1 keeps 2 columns at 760px and 4 columns at 1001px', async ({ page }, testInfo) => {
    onlyDesktopProject(testInfo);
    await page.setViewportSize({ width: 760, height: 900 });
    await page.goto('/dev/books');
    expect(await bookGridColumns(page)).toBe(2);
    await page.setViewportSize({ width: 1001, height: 900 });
    expect(await bookGridColumns(page)).toBe(4);
  });
});

test.describe('without the API', () => {
  for (const width of WIDTHS) {
    test(`A1 the home page has no band between its last section and the footer (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const gap = await page.evaluate(() => {
        const footer = document.querySelector('footer')!.getBoundingClientRect();
        const main = document.querySelector('main')!;
        const last = main.lastElementChild!.getBoundingClientRect();
        return Math.round(footer.top - last.bottom);
      });
      expect(gap).toBe(0);
    });

    test(`B the home page hides every unfinished section (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('main [data-soon-badge]')).toHaveCount(0);
      await expect(page.locator('main [data-feature]')).toHaveCount(0);
      for (const label of [
        messages.home.spotlight.heading,
        messages.home.trending.heading,
        messages.home.teamPicks.heading,
        messages.home.showcase.bookOfMonthTitle,
        messages.home.showcase.eventTitle,
      ]) {
        await expect(page.getByText(label)).toHaveCount(0);
      }
      // the live parts stay
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByRole('link', { name: messages.home.showcase.newReleasesTitle }),
      ).toBeVisible();
    });

    test(`B search results keep no dimmed tabs (${width}px)`, async ({ page }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/books?q=test');
      await expect(page.locator('main [data-soon-badge]')).toHaveCount(0);
      // the tabs row itself is left out while neither extra tab is live (a lone "books" tab says nothing)
      await expect(page.getByRole('navigation', { name: messages.search.title })).toHaveCount(0);
      await expect(
        page.locator('main').getByText(messages.search.events, { exact: true }),
      ).toHaveCount(0);
    });
  }

  const openOverlay = async (page: Page, width: number) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/zz-no-such-page');
    const header = page.locator('header').first();
    await (
      width <= 1000
        ? header.getByRole('button', { name: messages.search.open })
        : header.getByRole('searchbox')
    ).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600);
    return dialog;
  };

  for (const width of WIDTHS) {
    test(`A15 the search overlay has a designed empty state (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.route('**/api/v1/search/suggest*', (route) => route.fulfill({ json: [] }));
      const dialog = await openOverlay(page, width);
      await dialog.getByRole('combobox').fill('zzqxjkwv');
      const empty = dialog.locator('[data-search-state="empty"]');
      await expect(empty).toBeVisible();
      await expect(empty).toContainText(messages.search.empty);
      await expect(empty.locator('svg')).toHaveCount(1);
    });

    test(`A15 the search overlay error has a retry that re-runs the same query (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      const queries: string[] = [];
      await page.route('**/api/v1/search/suggest*', (route) => {
        queries.push(new URL(route.request().url()).searchParams.get('q') ?? '');
        if (queries.length === 1) return route.fulfill({ status: 500, body: '' });
        return route.fulfill({
          json: [{ title: 'نتيجة', slug: 'x', coverImageUrl: null }],
        });
      });
      const dialog = await openOverlay(page, width);
      await dialog.getByRole('combobox').fill('كتاب');
      const error = dialog.locator('[data-search-state="error"]');
      await expect(error).toBeVisible();
      await expect(error).toContainText(messages.search.error);

      await error.getByRole('button', { name: messages.site.loadError.retry }).click();
      await expect(dialog.getByRole('option')).toHaveCount(1);
      expect(queries).toEqual(['كتاب', 'كتاب']);
      await expect(error).toHaveCount(0);
    });
  }
});

test.describe('with the real API', () => {
  test.skip(!isRealApiEnabled, realApiSkipReason);
  test.describe.configure({ mode: 'default' });
  test.use({ baseURL: process.env.E2E_POLISH_ORIGIN ?? webOrigin });

  let categorySlug: string;

  test.beforeAll(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
    test.setTimeout(300_000);
    await startRealApi();
    const categories = (await (await fetch(`${apiOrigin}/api/v1/categories`)).json()) as {
      slug: string;
      bookCount: number;
    }[];
    categorySlug = categories.find((c) => c.bookCount > 0)!.slug;
  });

  test.afterAll(() => {
    stopRealApi();
  });

  // The page parameter the app should end on: the last page the API has for this query (the app sends no pageSize, so the
  // backend's default decides it; so does this request), and none when everything fits on the first page. The data of
  // the isolated database decides, so it is asked, not assumed.
  async function lastPageParam(query: string) {
    const result = (await (await fetch(`${apiOrigin}${query}page=1`)).json()) as {
      totalPages?: number;
      totalCount: number;
      pageSize: number;
    };
    const totalPages = result.totalPages ?? Math.ceil(result.totalCount / result.pageSize);
    return totalPages > 1 ? String(totalPages) : null;
  }

  test('A8 a page beyond the last one goes to the last valid page, with the books', async ({
    page,
  }, testInfo) => {
    onlyDesktopProject(testInfo);
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/books?page=99&sort=price_asc');
    await expect(page.locator('main a[href^="/books/"]').first()).toBeVisible();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/books');
    // the other parameters stay; the page is the last valid one (the first, with no page parameter, when everything fits)
    expect(url.searchParams.get('sort')).toBe('price_asc');
    expect(url.searchParams.get('page')).toBe(await lastPageParam('/api/v1/books?'));
    await expect(page.getByText(messages.catalog.emptyTitle, { exact: true })).toHaveCount(0);

    await page.goto(`/categories/${encodeURIComponent(categorySlug)}?page=99`);
    await expect(page.locator('main a[href^="/books/"]').first()).toBeVisible();
    expect(new URL(page.url()).searchParams.get('page')).toBe(
      await lastPageParam(`/api/v1/books?category=${encodeURIComponent(categorySlug)}&`),
    );
  });

  for (const width of WIDTHS) {
    test(`A3 the category breadcrumb sits in the page gutter and is not clipped (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/categories/${encodeURIComponent(categorySlug)}`);
      const crumbs = page.locator('main nav').first();
      await expect(crumbs).toBeVisible();
      const info = await crumbs.evaluate((nav) => {
        const box = nav.getBoundingClientRect();
        const clipped = Array.from(nav.querySelectorAll('a, span')).filter(
          (e) => e instanceof HTMLElement && e.scrollWidth > e.clientWidth + 1,
        ).length;
        return {
          left: box.left,
          right: box.right,
          viewport: document.documentElement.clientWidth,
          clipped,
        };
      });
      expect(info.left).toBeGreaterThanOrEqual(15);
      expect(info.right).toBeLessThanOrEqual(info.viewport - 15);
      expect(info.clipped).toBe(0);
    });

    test(`A10 every real author card shows a photo or initials, never a blank block (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/authors');
      const cards = page.locator('main article');
      await expect(cards.first()).toBeVisible();
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
      // each card has either a photo or the decorative initials (the data decides which), and no empty placeholder
      for (let index = 0; index < cardCount; index += 1) {
        const card = cards.nth(index);
        const hasPhoto = (await card.locator('img').count()) > 0;
        const hasInitials = (await card.locator('[data-author-initials]').count()) > 0;
        expect(hasPhoto || hasInitials, `card ${index}`).toBe(true);
      }
      await expect(page.locator('main article [role="img"]')).toHaveCount(0);
      expect(await gapBelow(page, 'main h1')).toBeGreaterThanOrEqual(20);
    });

    test(`A9 the home category heading keeps its distance (${width}px)`, async ({
      page,
    }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      expect(await gapBelow(page, '#home-categories-heading')).toBeGreaterThanOrEqual(20);
    });
  }

  for (const width of [761, 800, 1000] as const) {
    test(`C1 the real store grid has 3 columns at ${width}px`, async ({ page }, testInfo) => {
      onlyDesktopProject(testInfo);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/books');
      await expect(page.locator('main a[href^="/books/"]').first()).toBeVisible();
      expect(await bookGridColumns(page)).toBe(3);
    });
  }
});
