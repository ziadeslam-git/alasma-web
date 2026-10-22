import type { paths } from '@/shared/lib/api';

import { DEFAULT_CATALOG_SORT, type CatalogParams } from './catalog-params';

// The exact query object of GET /books, typed from the generated schema (never hand-copied).
export type BooksApiQuery = NonNullable<paths['/api/v1/books']['get']['parameters']['query']>;

// The backend caps a page at 48 (PageRequest.MaxPageSize); without a pageSize it uses 20.
export const MAX_API_PAGE_SIZE = 48;

export type ApiQueryOptions = { pageSize?: number };

export function toApiQuery(params: CatalogParams, options: ApiQueryOptions = {}): BooksApiQuery {
  const query: BooksApiQuery = { page: params.page };

  if (params.q !== undefined) query.q = params.q;
  if (params.category !== undefined) query.category = params.category;
  if (params.author !== undefined) query.author = params.author;
  if (params.publisher !== undefined) query.publisher = params.publisher;
  if (params.minPrice !== undefined) query.minPrice = params.minPrice;
  if (params.maxPrice !== undefined) query.maxPrice = params.maxPrice;
  // The API treats false like "no filter", so only the "on" state is sent.
  if (params.inStock) query.inStock = true;
  if (params.hasDiscount) query.hasDiscount = true;
  if (params.sort !== DEFAULT_CATALOG_SORT) query.sort = params.sort;

  const { pageSize } = options;
  if (pageSize !== undefined && Number.isInteger(pageSize)) {
    query.pageSize = Math.min(Math.max(pageSize, 1), MAX_API_PAGE_SIZE);
  }

  return query;
}
