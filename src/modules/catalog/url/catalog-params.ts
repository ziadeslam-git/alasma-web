// The URL is the single source of truth of the catalog filters. This file is the pure contract between a URL and a
// typed CatalogParams value: it never throws and only ever returns values the backend (GET /books) accepts.

export const CATALOG_SORTS = ['newest', 'price_asc', 'price_desc', 'title'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const DEFAULT_CATALOG_SORT: CatalogSort = 'newest';
export const DEFAULT_CATALOG_PAGE = 1;

// Same limits as the backend validator (BookSearchFilterValidator and CatalogQueryLimits.MaxSlugLength).
export const MAX_QUERY_LENGTH = 200;
export const MAX_SLUG_LENGTH = 350;
// Far above any real price, it only keeps absurd numbers out of the URL.
export const MAX_PRICE = 10_000_000;
export const MAX_PAGE = 100_000;

export type CatalogParams = {
  q?: string;
  // Slug (or numeric id) of a category, an author and a publisher: the API takes ONE value for each.
  category?: string;
  author?: string;
  publisher?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  hasDiscount: boolean;
  sort: CatalogSort;
  page: number;
};

// Next's searchParams shape.
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const emptyCatalogParams: CatalogParams = {
  inStock: false,
  hasDiscount: false,
  sort: DEFAULT_CATALOG_SORT,
  page: DEFAULT_CATALOG_PAGE,
};

// Letters, digits, marks, "-" and "_" in any script (Arabic slugs), so ":", "<", quotes and spaces never get in.
const slugPattern = /^[\p{L}\p{N}\p{M}_-]+$/u;
const priceTextPattern = /^\d+(\.\d{1,2})?$/;
const pageTextPattern = /^[1-9]\d*$/;
// Rejects control characters in free text.
const controlCharacters = /[\u0000-\u001F\u007F]/;

export function sanitizeSlug(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const slug = value.trim();
  if (slug.length === 0 || slug.length > MAX_SLUG_LENGTH || !slugPattern.test(slug)) {
    return undefined;
  }

  return slug;
}

export function sanitizeQuery(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const query = value.trim();
  if (query.length === 0 || query.length > MAX_QUERY_LENGTH || controlCharacters.test(query)) {
    return undefined;
  }

  return query;
}

// Accepts a non-negative decimal number with at most two decimals, as text or as a number. No exponent, no sign.
export function sanitizePrice(value: unknown): number | undefined {
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (typeof text !== 'string' || !priceTextPattern.test(text.trim())) {
    return undefined;
  }

  const price = Number(text.trim());
  return Number.isFinite(price) && price <= MAX_PRICE ? price : undefined;
}

export function sanitizeSort(value: unknown): CatalogSort {
  return CATALOG_SORTS.find((sort) => sort === value) ?? DEFAULT_CATALOG_SORT;
}

export function sanitizePage(value: unknown): number {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !pageTextPattern.test(text)) {
    return DEFAULT_CATALOG_PAGE;
  }

  const page = Number(text);
  return Number.isSafeInteger(page) && page <= MAX_PAGE ? page : DEFAULT_CATALOG_PAGE;
}

// Documented forms: "true" turns the switch on. "false" (and anything else) is the default, off.
export function sanitizeFlag(value: unknown): boolean {
  return value === true || value === 'true';
}

// A minimum above the maximum is repaired by swapping the two (the visitor most likely typed them the wrong way
// round), so the URL always describes a range the API accepts.
export function orderPriceRange(
  minPrice: number | undefined,
  maxPrice: number | undefined,
): Pick<CatalogParams, 'minPrice' | 'maxPrice'> {
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return { minPrice: maxPrice, maxPrice: minPrice };
  }

  return {
    ...(minPrice === undefined ? {} : { minPrice }),
    ...(maxPrice === undefined ? {} : { maxPrice }),
  };
}

// Turns any partial value into a valid CatalogParams. Used by the parser and by the href helpers.
export function normalizeCatalogParams(
  input: Partial<Record<keyof CatalogParams, unknown>>,
): CatalogParams {
  const q = sanitizeQuery(input.q);
  const category = sanitizeSlug(input.category);
  const author = sanitizeSlug(input.author);
  const publisher = sanitizeSlug(input.publisher);
  const range = orderPriceRange(sanitizePrice(input.minPrice), sanitizePrice(input.maxPrice));

  return {
    ...(q === undefined ? {} : { q }),
    ...(category === undefined ? {} : { category }),
    ...(author === undefined ? {} : { author }),
    ...(publisher === undefined ? {} : { publisher }),
    ...range,
    inStock: sanitizeFlag(input.inStock),
    hasDiscount: sanitizeFlag(input.hasDiscount),
    sort: sanitizeSort(input.sort),
    page: sanitizePage(input.page),
  };
}

// Repeated keys use the FIRST value (an invalid first value is dropped, the next one is not tried).
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const urlKeys = [
  'q',
  'category',
  'author',
  'publisher',
  'minPrice',
  'maxPrice',
  'inStock',
  'hasDiscount',
  'sort',
  'page',
] as const satisfies readonly (keyof CatalogParams)[];

// Never throws: anything that is not a plain object gives the defaults. Unknown keys are ignored.
export function parseCatalogParams(searchParams: unknown): CatalogParams {
  if (typeof searchParams !== 'object' || searchParams === null) {
    return { ...emptyCatalogParams };
  }

  const source = searchParams as RawSearchParams;
  const picked: Partial<Record<keyof CatalogParams, unknown>> = {};
  for (const key of urlKeys) {
    if (Object.hasOwn(source, key)) {
      picked[key] = firstValue(source[key]);
    }
  }

  return normalizeCatalogParams(picked);
}
