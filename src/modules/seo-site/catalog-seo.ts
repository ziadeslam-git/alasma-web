import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import {
  DEFAULT_CATALOG_SORT,
  parseCatalogParams,
  type CatalogParams,
  type RawSearchParams,
} from '@/modules/catalog';
import { categoryRoute, routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

export type CatalogSeoRuleResult = {
  canonicalPath: string;
  noindex: boolean;
  follow: boolean;
};

function firstRawValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function hasAnyActiveFilterOrSort(params: CatalogParams): boolean {
  return (
    params.q !== undefined ||
    params.category !== undefined ||
    params.author !== undefined ||
    params.publisher !== undefined ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined ||
    params.inStock ||
    params.hasDiscount ||
    params.sort !== DEFAULT_CATALOG_SORT
  );
}

const KNOWN_FILTER_KEYS = [
  'q',
  'category',
  'author',
  'publisher',
  'minPrice',
  'maxPrice',
  'inStock',
  'hasDiscount',
  'sort',
] as const;

/**
 * Checks whether the raw query string attempted to pass any filter, sort, search or invalid
 * pagination parameter even if `parseCatalogParams` dropped it as invalid.
 */
function hasRawNonPaginationOrInvalidQuery(
  rawSearchParams: RawSearchParams | undefined,
  parsed: CatalogParams,
): boolean {
  if (!rawSearchParams) {
    return false;
  }

  for (const key of KNOWN_FILTER_KEYS) {
    const raw = firstRawValue(rawSearchParams[key]);
    if (raw !== undefined && raw.trim() !== '') {
      // Any non-empty filter/sort/q key in the URL (valid or invalid, except default sort='newest')
      // triggers the filter/sort rule unless it is literally sort=newest with no other filter.
      if (key === 'sort' && raw === DEFAULT_CATALOG_SORT) {
        continue;
      }
      return true;
    }
  }

  const rawPage = firstRawValue(rawSearchParams.page);
  if (rawPage !== undefined && rawPage.trim() !== '') {
    if (String(parsed.page) !== rawPage.trim()) {
      return true;
    }
  }

  return false;
}

/**
 * Computes canonical path and robots rule for `/books` or `/categories/[slug]`
 * according to Decision 20:
 * - Any filter, sort, search (`q`) or invalid filter/page value -> `noindex: true, follow: true` and base canonical (`basePath`).
 * - Pagination alone (`page > 1`) -> `noindex: false, follow: true` and self canonical (`${basePath}?page=${page}`).
 * - Page 1 with no filters -> `noindex: false, follow: true` and base canonical (`basePath`).
 */
export function resolveCatalogSeoRule(
  basePath: string,
  parsed: CatalogParams,
  rawSearchParams?: RawSearchParams,
): CatalogSeoRuleResult {
  const isFilteredOrInvalid =
    hasAnyActiveFilterOrSort(parsed) || hasRawNonPaginationOrInvalidQuery(rawSearchParams, parsed);

  if (isFilteredOrInvalid) {
    return {
      canonicalPath: basePath,
      noindex: true,
      follow: true,
    };
  }

  const canonicalPath = parsed.page > 1 ? `${basePath}?page=${parsed.page}` : basePath;
  return {
    canonicalPath,
    noindex: false,
    follow: true,
  };
}

export function buildBooksCatalogMetadata(rawSearchParams: RawSearchParams = {}): Metadata {
  const parsed = parseCatalogParams(rawSearchParams);
  const rule = resolveCatalogSeoRule(routes.books, parsed, rawSearchParams);

  return buildPageMetadata({
    title: messages.catalog.page.meta.title,
    description: messages.catalog.page.meta.description,
    path: rule.canonicalPath,
    noindex: rule.noindex,
    follow: rule.follow,
  });
}

export function buildCategoryCatalogMetadata(
  category: { name: string; slug: string; imageUrl?: string | null },
  rawSearchParams: RawSearchParams = {},
): Metadata {
  const basePath = categoryRoute(category.slug);
  const parsed = parseCatalogParams(rawSearchParams);
  const rule = resolveCatalogSeoRule(basePath, parsed, rawSearchParams);
  const description = messages.seo.categoryDescription.replace('{name}', category.name);

  return buildPageMetadata({
    title: category.name,
    description,
    path: rule.canonicalPath,
    image: category.imageUrl,
    noindex: rule.noindex,
    follow: rule.follow,
  });
}
