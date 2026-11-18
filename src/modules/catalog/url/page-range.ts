import { routes } from '@/shared/config/routes';

import type { CatalogBooksResult } from '../types';
import { buildCatalogHref } from './catalog-href';
import type { CatalogParams } from './catalog-params';

// A page number beyond the last page returns no books while the total count is not zero. The page sends such a visitor
// to the last valid page (with every other parameter kept) instead of showing an empty list with a count above it:
// they land on real content, and the URL stays canonical. A genuinely empty result, a failed load and an invalid
// filter are not this case (null).
export function getOutOfRangeHref(
  books: Pick<CatalogBooksResult, 'status' | 'totalCount' | 'totalPages'>,
  params: CatalogParams,
  basePath: string = routes.books,
): string | null {
  if (books.status !== 'empty' || books.totalCount <= 0 || books.totalPages < 1) return null;
  if (params.page <= books.totalPages) return null;
  return buildCatalogHref(basePath, { ...params, page: books.totalPages });
}
