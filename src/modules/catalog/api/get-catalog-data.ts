import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';

import type { CatalogBooksResult, CatalogData } from '../types';
import { toApiQuery } from '../url/catalog-api-query';
import type { CatalogParams } from '../url/catalog-params';

export const DEFAULT_CATALOG_PAGE_SIZE = 12;
export const CATALOG_BOOKS_REVALIDATE_SECONDS = 60;
export const CATALOG_OPTIONS_REVALIDATE_SECONDS = 300;

export const CATALOG_CACHE_TAGS = {
  books: 'books',
  categories: 'categories',
  authors: 'authors:options',
  publishers: 'publishers',
} as const;

export type GetCatalogDataOptions = ServerClientOptions & {
  pageSize?: number;
};

function getErrorStatus(reason: unknown): number | 'network' {
  if (
    typeof reason === 'object' &&
    reason !== null &&
    'status' in reason &&
    typeof (reason as { status: unknown }).status === 'number'
  ) {
    return (reason as { status: number }).status;
  }

  return 'network';
}

function toOptionList<T>(
  settled: PromiseSettledResult<readonly T[]>,
  resourceName: string,
): readonly T[] {
  if (settled.status === 'rejected') {
    const status = getErrorStatus(settled.reason);
    console.error(`[catalog] Failed to fetch ${resourceName} (${String(status)})`);
    return [];
  }

  return settled.value;
}

function toBooksResult(
  settled: PromiseSettledResult<{
    items: CatalogBooksResult['items'];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages?: number;
  }>,
  fallbackPage: number,
  fallbackPageSize: number,
): CatalogBooksResult {
  if (settled.status === 'rejected') {
    const status = getErrorStatus(settled.reason);
    if (status === 400) {
      console.error('[catalog] Invalid catalog filter parameters (400)');
      return {
        status: 'invalid',
        items: [],
        page: fallbackPage,
        pageSize: fallbackPageSize,
        totalCount: 0,
        totalPages: 0,
      };
    }

    console.error(`[catalog] Failed to fetch books (${String(status)})`);
    return {
      status: 'error',
      items: [],
      page: fallbackPage,
      pageSize: fallbackPageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const data = settled.value;
  const pageSize = data.pageSize > 0 ? data.pageSize : fallbackPageSize;
  const totalPages =
    data.totalPages ?? (data.totalCount > 0 ? Math.ceil(data.totalCount / pageSize) : 0);

  return {
    status: data.items.length > 0 ? 'ok' : 'empty',
    items: data.items,
    page: data.page,
    pageSize,
    totalCount: data.totalCount,
    totalPages,
  };
}

// Fetches the paginated catalog books alongside the three filter option lists (categories tree, author options,
// publishers) in parallel. Option lists degrade to empty arrays on failure so the catalog results still render;
// a 400 on GET /api/v1/books maps to status 'invalid' (recoverable via filter reset) while 5xx/network maps to 'error'.
export async function getCatalogData(
  params: CatalogParams,
  options: GetCatalogDataOptions = {},
): Promise<CatalogData> {
  const { pageSize, ...clientOptions } = options;
  const client = createServerClient(clientOptions);
  const query = toApiQuery(params, pageSize !== undefined ? { pageSize } : undefined);
  const fallbackPageSize = query.pageSize ?? DEFAULT_CATALOG_PAGE_SIZE;

  const [booksSettled, categoriesSettled, authorsSettled, publishersSettled] =
    await Promise.allSettled([
      client
        .GET('/api/v1/books', {
          params: { query },
          ...nextFetch({
            revalidate: CATALOG_BOOKS_REVALIDATE_SECONDS,
            tags: [CATALOG_CACHE_TAGS.books],
          }),
        })
        .then(throwIfError),
      client
        .GET('/api/v1/categories', {
          ...nextFetch({
            revalidate: CATALOG_OPTIONS_REVALIDATE_SECONDS,
            tags: [CATALOG_CACHE_TAGS.categories],
          }),
        })
        .then(throwIfError),
      client
        .GET('/api/v1/authors/options', {
          ...nextFetch({
            revalidate: CATALOG_OPTIONS_REVALIDATE_SECONDS,
            tags: [CATALOG_CACHE_TAGS.authors],
          }),
        })
        .then(throwIfError),
      client
        .GET('/api/v1/publishers', {
          ...nextFetch({
            revalidate: CATALOG_OPTIONS_REVALIDATE_SECONDS,
            tags: [CATALOG_CACHE_TAGS.publishers],
          }),
        })
        .then(throwIfError),
    ]);

  return {
    books: toBooksResult(booksSettled, params.page, fallbackPageSize),
    options: {
      categories: toOptionList(categoriesSettled, 'categories'),
      authors: toOptionList(authorsSettled, 'authors'),
      publishers: toOptionList(publishersSettled, 'publishers'),
    },
  };
}
