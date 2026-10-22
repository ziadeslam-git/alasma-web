import {
  DEFAULT_CATALOG_PAGE,
  DEFAULT_CATALOG_SORT,
  normalizeCatalogParams,
  type CatalogParams,
} from './catalog-params';

// The stable order of the query string.
const keyOrder = [
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

// Keys of the filters a chip can remove. "price" removes both ends of the range.
export type CatalogFilterKey =
  'q' | 'category' | 'author' | 'publisher' | 'price' | 'inStock' | 'hasDiscount';

export type CatalogFilterPatch = Partial<Omit<CatalogParams, 'page' | 'sort'>>;

function serializeValue(key: (typeof keyOrder)[number], params: CatalogParams): string | undefined {
  switch (key) {
    case 'inStock':
    case 'hasDiscount':
      return params[key] ? 'true' : undefined;
    case 'sort':
      return params.sort === DEFAULT_CATALOG_SORT ? undefined : params.sort;
    case 'page':
      return params.page === DEFAULT_CATALOG_PAGE ? undefined : String(params.page);
    case 'minPrice':
    case 'maxPrice':
      return params[key] === undefined ? undefined : String(params[key]);
    default:
      return params[key];
  }
}

// Defaults and empty values are omitted, keys come in a fixed order, values are percent-encoded (Arabic slugs too).
export function buildCatalogQuery(params: CatalogParams): string {
  const normalized = normalizeCatalogParams(params);
  const pairs: string[] = [];

  for (const key of keyOrder) {
    const value = serializeValue(key, normalized);
    if (value !== undefined) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  return pairs.join('&');
}

export function buildCatalogHref(basePath: string, params: CatalogParams): string {
  const query = buildCatalogQuery(params);
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

// A filter, the sort or the query changed: the old page number no longer makes sense, so it goes back to 1.
export function withFilter(params: CatalogParams, patch: CatalogFilterPatch): CatalogParams {
  return normalizeCatalogParams({ ...params, ...patch, page: DEFAULT_CATALOG_PAGE });
}

export function withoutFilter(params: CatalogParams, key: CatalogFilterKey): CatalogParams {
  const next: Partial<Record<keyof CatalogParams, unknown>> = {
    ...params,
    page: DEFAULT_CATALOG_PAGE,
  };

  if (key === 'price') {
    delete next.minPrice;
    delete next.maxPrice;
  } else if (key === 'inStock' || key === 'hasDiscount') {
    next[key] = false;
  } else {
    delete next[key];
  }

  return normalizeCatalogParams(next);
}

// Removes every filter. The search text and the sort are not filters, so they stay.
export function clearFilters(params: CatalogParams): CatalogParams {
  return normalizeCatalogParams({
    ...(params.q === undefined ? {} : { q: params.q }),
    sort: params.sort,
    page: DEFAULT_CATALOG_PAGE,
  });
}

export function withSort(params: CatalogParams, sort: CatalogParams['sort']): CatalogParams {
  return normalizeCatalogParams({ ...params, sort, page: DEFAULT_CATALOG_PAGE });
}

// The only change that keeps the other values and does NOT reset the page.
export function withPage(params: CatalogParams, page: number): CatalogParams {
  return normalizeCatalogParams({ ...params, page });
}

const filterKeys: readonly CatalogFilterKey[] = [
  'category',
  'author',
  'publisher',
  'price',
  'inStock',
  'hasDiscount',
];

// How many filters are on: the price range counts once. The search text is not a filter.
export function countActiveFilters(params: CatalogParams): number {
  return filterKeys.filter((key) => {
    if (key === 'price') {
      return params.minPrice !== undefined || params.maxPrice !== undefined;
    }

    return Boolean(params[key]);
  }).length;
}
