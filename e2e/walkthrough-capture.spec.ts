import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  webOrigin,
  assertIsolatedDatabase,
} from './support/real-api-server';

// Task 45 + 54 audit capture (NOT a regression test): walks every customer-facing page against the real API at
// 360 / 768 / 1280, signed out and signed in, writes one PNG per page and width plus a measurements file, and asserts
// nothing beyond "the page rendered". Skipped unless E2E_REAL_API=1 AND E2E_CAPTURE_DIR (a folder outside the repo,
// because Playwright wipes test-results/) are set. It spawns its OWN API (and reads its log to confirm the e-mail of the
// signed-in user, which needs the API log, so it carries its own spawn code like auth-screens-real-api.spec.ts).
const captureDir = process.env.E2E_CAPTURE_DIR;
const apiDir = resolve(process.env.E2E_API_DIR ?? '../AlAsmaPro');
const WIDTHS = [360, 768, 1280] as const;

test.skip(!isRealApiEnabled, realApiSkipReason);
test.skip(!captureDir, 'Set E2E_CAPTURE_DIR to a folder outside the repo to capture screenshots.');
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin, actionTimeout: 20_000 });

type Measure = {
  name: string;
  width: number;
  url: string;
  status: number | null;
  finalUrl: string;
  title: string;
  h1: number;
  mains: number;
  overflowX: boolean;
  scrollWidth: number;
  soonBadges: number;
  clipped: string[];
  brokenImages: number;
};

const measures: Measure[] = [];
const notes: string[] = [];
let api: ChildProcess | undefined;
let apiLog = '';

async function startApi() {
  apiLog = '';
  assertIsolatedDatabase();
  api = spawn(
    'dotnet',
    ['run', '--project', 'src/AlAsmaPro.Api', '--no-launch-profile', '--urls', apiOrigin],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: 'Development',
        Cors__AllowedOrigins__0: 'http://localhost:3000',
        Cors__AllowedOrigins__1: webOrigin,
        Smtp__FromAddress: '',
        Smtp__Password: '',
        Smtp__UserName: '',
        Cloudinary__CloudName: '',
        Cloudinary__ApiKey: '',
        Cloudinary__ApiSecret: '',
      },
    },
  );
  const collect = (chunk: Buffer) => {
    apiLog += chunk.toString();
  };
  api.stdout?.on('data', collect);
  api.stderr?.on('data', collect);
  await expect
    .poll(() => apiLog.includes('Now listening on'), { intervals: [500], timeout: 180_000 })
    .toBe(true);
}

function stopApi() {
  const pid = api?.pid;
  if (pid === undefined) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  else api?.kill('SIGTERM');
}

async function confirmEmail(email: string) {
  let link: { userId: number; token: string } | undefined;
  await expect
    .poll(
      () => {
        const at = apiLog.lastIndexOf(`Email to ${email}`);
        const match = /href="[^"]*userId=(\d+)&amp;token=([^"]+)"/.exec(
          at < 0 ? '' : apiLog.slice(at),
        );
        link =
          match?.[1] && match[2]
            ? { token: decodeURIComponent(match[2]), userId: Number(match[1]) }
            : undefined;
        return link !== undefined;
      },
      { intervals: [300], timeout: 20_000 },
    )
    .toBe(true);
  const confirm = await fetch(`${apiOrigin}/api/v1/auth/confirm-email`, {
    body: JSON.stringify(link),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  expect(confirm.status).toBe(204);
}

const newUser = (label: string) => ({
  email: `e2e-walk-${label}-${Date.now()}@example.com`,
  password: `Aa1!${randomBytes(12).toString('base64url')}`,
});

async function register(page: Page, user: { email: string; password: string }) {
  await page.goto('/register');
  await page.locator('[name="fullName"]').fill('E2E Walkthrough');
  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="phone"]').fill('01000000000');
  await page.locator('[name="password"]').fill(user.password);
  await page.locator('[name="confirmPassword"]').fill(user.password);
  await page.locator('[name="terms"]').check();
  await page.getByRole('button', { name: messages.auth.register, exact: true }).click();
  await expect(page.getByText(messages.auth.registerSuccessTitle)).toBeVisible({ timeout: 30_000 });
}

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  const form = page.locator('#main-content form:has(input[name="email"]:enabled)');
  await expect(form).toHaveCount(1, { timeout: 30_000 });
  await form.locator('[name="email"]').fill(user.email);
  await form.locator('[name="password"]').fill(user.password);
  await form.getByRole('button', { name: messages.auth.login, exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });
}

// Lazy images load only near the viewport: scroll the whole page once, wait for the images, go back to the top.
async function settle(page: Page) {
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.evaluate(async () => {
    const step = Math.max(300, innerHeight / 2);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, {
      timeout: 8_000,
    })
    .catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
}

async function measure(
  page: Page,
  name: string,
  width: number,
  url: string,
  status: number | null,
) {
  const data = await page.evaluate(() => {
    const clipped: string[] = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const style = getComputedStyle(element);
      if (
        element.clientWidth > 0 &&
        element.scrollWidth > element.clientWidth + 1 &&
        style.overflowX !== 'visible' &&
        style.overflowX !== 'auto' &&
        style.overflowX !== 'scroll' &&
        (element.textContent ?? '').trim().length > 0 &&
        !element.closest('[inert]')
      ) {
        clipped.push(
          `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0] ?? ''}: ${(
            element.textContent ?? ''
          )
            .trim()
            .slice(0, 40)}`,
        );
      }
    }
    return {
      title: document.title,
      h1: document.querySelectorAll('h1').length,
      mains: document.querySelectorAll('main').length,
      scrollWidth: document.documentElement.scrollWidth,
      overflowX: document.documentElement.scrollWidth > innerWidth,
      soonBadges: document.querySelectorAll('[data-soon-badge]').length,
      clipped: clipped.slice(0, 8),
      brokenImages: Array.from(document.images).filter(
        (img) => img.complete && img.naturalWidth === 0 && img.currentSrc !== '',
      ).length,
    };
  });
  measures.push({
    name,
    width,
    url,
    status,
    finalUrl: new URL(page.url()).pathname + new URL(page.url()).search,
    ...data,
  });
}

// One screenshot per width. `prepare` runs after navigation (open a dialog, type a query, ...).
async function visit(
  page: Page,
  name: string,
  url: string,
  options: { prepare?: (page: Page, width: number) => Promise<void>; fullPage?: boolean } = {},
) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(url, { waitUntil: 'load' });
    await expect(page.locator('body')).toBeVisible();
    await settle(page);
    if (options.prepare) await options.prepare(page, width);
    await measure(page, name, width, url, response?.status() ?? null);
    await page.screenshot({
      fullPage: options.fullPage ?? true,
      path: resolve(captureDir!, `${name}-${width}.png`),
    });
  }
}

const openSearch = async (page: Page, width: number) => {
  const header = page.locator('header').first();
  await (
    width <= 1000
      ? header.getByRole('button', { name: messages.search.open })
      : header.getByRole('searchbox')
  ).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // let the open animation finish, so the capture shows the settled dialog and not a half-faded one
  await page.waitForTimeout(700);
};

type Book = {
  slug: string;
  title: string;
  discountPercent: number;
  coverImageUrl: string | null;
  stockStatus: string;
};
type Category = { slug: string; name: string; bookCount: number; children: Category[] };

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiOrigin}${path}`);
  expect(response.ok, path).toBe(true);
  return (await response.json()) as T;
}

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(300_000);
  mkdirSync(captureDir!, { recursive: true });
  await startApi();
});

test.afterAll(() => {
  stopApi();
  if (captureDir) {
    writeFileSync(resolve(captureDir, 'measures.json'), JSON.stringify(measures, null, 2));
    writeFileSync(resolve(captureDir, 'notes.txt'), notes.join('\n'));
  }
});

test('walk the public pages signed out', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(1_800_000);

  const list = await getJson<{ items: Book[]; totalPages?: number; totalCount: number }>(
    '/api/v1/books?page=1&pageSize=48',
  );
  const books = list.items;
  const authors = (
    await getJson<{ items: { slug: string; name: string }[] }>('/api/v1/authors?page=1&pageSize=48')
  ).items;
  const categories = await getJson<Category[]>('/api/v1/categories');
  const flatCategories = categories.flatMap((category) => [category, ...category.children]);
  notes.push(
    `books=${list.totalCount} authors=${authors.length} categories=${flatCategories.length}`,
    `discounted=${books.filter((b) => b.discountPercent > 0).length} noCover=${books.filter((b) => !b.coverImageUrl).length} outOfStock=${books.filter((b) => b.stockStatus === 'OutOfStock').length} lowStock=${books.filter((b) => b.stockStatus === 'LowStock').length}`,
  );

  // authors: one with books, one without
  const authorBookCounts = new Map<string, number>();
  for (const author of authors.slice(0, 20)) {
    const result = await getJson<{ totalCount: number }>(
      `/api/v1/books?author=${encodeURIComponent(author.slug)}&page=1&pageSize=1`,
    );
    authorBookCounts.set(author.slug, result.totalCount);
  }
  const authorWithBooks = authors.find((a) => (authorBookCounts.get(a.slug) ?? 0) > 0);
  const authorWithoutBooks = authors.find((a) => authorBookCounts.get(a.slug) === 0);
  notes.push(
    `authorWithBooks=${authorWithBooks?.slug} authorWithoutBooks=${authorWithoutBooks?.slug}`,
  );

  const categoryWithBooks = flatCategories.find((c) => c.bookCount > 0);
  const categoryEmpty = flatCategories.find((c) => c.bookCount === 0);
  const childCategory = flatCategories.find((c) => !categories.includes(c));
  notes.push(
    `categoryWithBooks=${categoryWithBooks?.slug} categoryEmpty=${categoryEmpty?.slug} child=${childCategory?.slug}`,
  );

  const pick = (predicate: (book: Book) => boolean, taken: Set<string>) =>
    books.find((book) => predicate(book) && !taken.has(book.slug));
  const taken = new Set<string>();
  const bookTargets: [string, Book | undefined][] = [];
  for (const [label, predicate] of [
    [
      'plain',
      (b: Book) => b.discountPercent === 0 && !!b.coverImageUrl && b.stockStatus === 'InStock',
    ],
    ['discount', (b: Book) => b.discountPercent > 0],
    ['nocover', (b: Book) => !b.coverImageUrl],
    ['outofstock', (b: Book) => b.stockStatus === 'OutOfStock'],
    ['lowstock', (b: Book) => b.stockStatus === 'LowStock'],
    ['any', () => true],
  ] as const) {
    const book = pick(predicate, taken);
    if (book) taken.add(book.slug);
    bookTargets.push([label, book]);
    if (!book) notes.push(`no book for variant "${label}" in the data`);
  }

  // --- home and store
  await visit(page, 'home', '/');
  await visit(page, 'home-viewport-tabbar', '/', {
    fullPage: false,
    prepare: async (p) => {
      await p.evaluate(() => scrollTo(0, 700));
      await p.waitForTimeout(300);
    },
  });
  await visit(page, 'books', '/books');
  await visit(page, 'books-sort-price', '/books?sort=price_asc');
  await visit(page, 'books-page2', '/books?page=2');
  // Task 83: the last page (the web page size is 12) and a filter + sort combination
  await visit(
    page,
    'books-lastpage',
    `/books?page=${Math.max(1, Math.ceil(list.totalCount / 12))}`,
  );
  if (categoryWithBooks)
    await visit(
      page,
      'books-filter-category',
      `/books?category=${encodeURIComponent(categoryWithBooks.slug)}`,
    );
  if (categoryWithBooks)
    await visit(
      page,
      'books-filters-combined',
      `/books?category=${encodeURIComponent(categoryWithBooks.slug)}&sort=price_asc&inStock=true`,
    );
  await visit(
    page,
    'books-search-hit',
    `/books?q=${encodeURIComponent(books[0]?.title.split(' ')[0] ?? 'a')}`,
  );
  await visit(page, 'books-search-nohit', '/books?q=zzqxjkwv');
  await visit(page, 'books-instock', '/books?inStock=true');
  await visit(page, 'books-bad-params', '/books?minPrice=-5&sort=nope&page=999999');

  // --- book details
  for (const [label, book] of bookTargets) {
    if (book) await visit(page, `book-${label}`, `/books/${encodeURIComponent(book.slug)}`);
  }

  // --- authors and categories
  await visit(page, 'authors', '/authors');
  if (authorWithBooks)
    await visit(page, 'author-with-books', `/authors/${encodeURIComponent(authorWithBooks.slug)}`);
  if (authorWithoutBooks)
    await visit(page, 'author-no-books', `/authors/${encodeURIComponent(authorWithoutBooks.slug)}`);
  await visit(page, 'categories', '/categories');
  if (categoryWithBooks)
    await visit(
      page,
      'category-with-books',
      `/categories/${encodeURIComponent(categoryWithBooks.slug)}`,
    );
  if (categoryEmpty)
    await visit(page, 'category-empty', `/categories/${encodeURIComponent(categoryEmpty.slug)}`);
  if (childCategory)
    await visit(page, 'category-child', `/categories/${encodeURIComponent(childCategory.slug)}`);

  // --- search overlay (viewport shots: the dialog is what matters)
  await visit(page, 'search-idle', '/', { fullPage: false, prepare: openSearch });
  await visit(page, 'search-results', '/', {
    fullPage: false,
    prepare: async (p, width) => {
      await openSearch(p, width);
      await p
        .getByRole('dialog')
        .getByRole('combobox')
        .fill(books[0]?.title ?? 'a');
      await expect(p.getByRole('dialog').getByRole('option').first()).toBeVisible({
        timeout: 15_000,
      });
    },
  });
  await visit(page, 'search-empty', '/', {
    fullPage: false,
    prepare: async (p, width) => {
      await openSearch(p, width);
      await p.getByRole('dialog').getByRole('combobox').fill('zzqxjkwv');
      await expect(p.getByRole('dialog').getByText(messages.search.empty)).toBeVisible({
        timeout: 15_000,
      });
    },
  });

  // --- content pages
  for (const key of [
    'about',
    'contact',
    'shipping-policy',
    'return-policy',
    'privacy-policy',
    'terms',
    'payment-methods',
    'faq',
  ]) {
    await visit(page, `page-${key}`, `/pages/${key}`);
  }

  // --- auth screens, cart, publish
  for (const [name, url] of [
    ['login', '/login'],
    ['register', '/register'],
    ['forgot-password', '/forgot-password'],
    ['reset-password-no-token', '/reset-password'],
    ['confirm-email-no-token', '/confirm-email'],
    ['cart-signed-out', '/cart'],
    ['checkout-signed-out', '/checkout'],
    ['publish', '/publish'],
  ] as const) {
    await visit(page, name, url);
  }

  // --- header menu, 404s
  await visit(page, 'menu-drawer', '/', {
    fullPage: false,
    prepare: async (p, width) => {
      // the menu button exists only up to 1000px (the desktop header shows the links instead)
      if (width > 1000) return;
      await p.getByRole('button', { name: messages.site.header.menu }).click();
      await expect(p.getByRole('dialog')).toBeVisible();
      await p.waitForTimeout(700);
    },
  });
  for (const [name, url] of [
    ['404-root', '/zz-no-such-page'],
    ['404-book', '/books/zz-no-such-book'],
    ['404-author', '/authors/zz-no-such-author'],
    ['404-category', '/categories/zz-no-such-category'],
    ['404-page', '/pages/zz-no-such-page'],
  ] as const) {
    await visit(page, name, url);
  }

  // --- dev reference pages for states the real data cannot produce (clearly prefixed "dev-")
  for (const [name, url] of [
    ['dev-home-empty', '/dev/home?state=empty'],
    ['dev-home-error', '/dev/home?state=error'],
    ['dev-books-empty', '/dev/books?state=empty'],
    ['dev-books-error', '/dev/books?state=error'],
    ['dev-books-invalid', '/dev/books?state=invalid'],
    ['dev-authors-empty', '/dev/authors?state=empty'],
    ['dev-categories-empty', '/dev/categories?state=empty'],
    ['dev-book-out-of-stock', '/dev/book?state=out-of-stock'],
    ['dev-book-no-cover', '/dev/book?state=no-cover'],
    ['dev-book-low-stock', '/dev/book?state=low-stock'],
    ['dev-book-long-title', '/dev/book?state=long-title'],
    ['dev-book-with-translator', '/dev/book?state=with-translator'],
    ['dev-book-no-related', '/dev/book?state=no-related'],
    ['dev-account-unconfirmed', '/dev/account?state=unconfirmed'],
    ['dev-account-long', '/dev/account?state=long'],
    ['dev-search-states', '/dev/search'],
    // Task 78: the 500 page (error.tsx inside the shell); /dev/error-test throws on render in development
    ['500-dev-error-test', '/dev/error-test'],
  ] as const) {
    await visit(page, name, url);
  }
});

async function walkSignedIn(
  context: BrowserContext,
  page: Page,
  label: string,
  user: { email: string; password: string },
) {
  await login(page, user);
  const pages: [string, string][] = [
    [`${label}-account`, '/account'],
    [`${label}-account-addresses`, '/account/addresses'],
    [`${label}-account-orders`, '/account/orders'],
    [`${label}-cart`, '/cart'],
    [`${label}-checkout`, '/checkout'],
    [`${label}-home`, '/'],
    [`${label}-login-redirect`, '/login'],
  ];
  for (const [name, url] of pages) await visit(page, name, url);
  await visit(page, `${label}-account-menu`, '/', {
    fullPage: false,
    prepare: async (p, width) => {
      // up to 1000px the header shows the menu button (the account sits inside that drawer); wider, the account button
      const trigger =
        width <= 1000
          ? p.getByRole('button', { name: messages.site.header.menu })
          : p
              .locator('header')
              .first()
              .getByRole('button', { name: /E2E Walkthrough/ });
      await trigger.first().click();
      await expect(p.getByRole('dialog')).toBeVisible();
      await p.waitForTimeout(700);
    },
  });
  void context;
}

test('walk the account area signed in (confirmed user)', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(600_000);
  const user = newUser('confirmed');
  await register(page, user);
  await confirmEmail(user.email);
  await walkSignedIn(context, page, 'in', user);
});

test('walk the account area signed in (unconfirmed user)', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(600_000);
  const user = newUser('unconfirmed');
  await register(page, user);
  try {
    await login(page, user);
  } catch {
    notes.push('unconfirmed user could not sign in (login stayed on /login)');
    await page.screenshot({
      path: resolve(captureDir!, 'unconfirmed-login-result.png'),
      fullPage: true,
    });
    return;
  }
  for (const [name, url] of [
    ['unconf-account', '/account'],
    ['unconf-cart', '/cart'],
  ] as const) {
    await visit(page, name, url);
  }
  void context;
});

test('capture the failed-load states with the API stopped', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'the widths are set in the test itself');
  test.setTimeout(900_000);
  const book = (await getJson<{ items: Book[] }>('/api/v1/books?page=1&pageSize=1')).items[0];
  const category = (await getJson<Category[]>('/api/v1/categories'))[0];
  const author = (await getJson<{ items: { slug: string }[] }>('/api/v1/authors?page=1&pageSize=1'))
    .items[0];

  stopApi();
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(`${apiOrigin}/api/v1/sitemap`)).ok;
        } catch {
          return false;
        }
      },
      { timeout: 30_000 },
    )
    .toBe(false);

  await visit(page, 'down-home', '/');
  await visit(page, 'down-books', '/books');
  await visit(page, 'down-authors', '/authors');
  await visit(page, 'down-categories', '/categories');
  if (book) await visit(page, 'down-book', `/books/${encodeURIComponent(book.slug)}`);
  if (category)
    await visit(page, 'down-category', `/categories/${encodeURIComponent(category.slug)}`);
  if (author) await visit(page, 'down-author', `/authors/${encodeURIComponent(author.slug)}`);
  await visit(page, 'down-page-about', '/pages/about');
  await visit(page, 'down-search-error', '/', {
    fullPage: false,
    prepare: async (p, width) => {
      await openSearch(p, width);
      await p.getByRole('dialog').getByRole('combobox').fill('كتاب');
      await expect(p.getByRole('dialog').getByText(messages.search.error)).toBeVisible({
        timeout: 15_000,
      });
    },
  });
});
