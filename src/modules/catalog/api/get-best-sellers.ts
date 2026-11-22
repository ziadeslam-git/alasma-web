import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';

import type { BookCardItem } from '../types';

export const BEST_SELLERS_REVALIDATE_SECONDS = 3600;
export const BEST_SELLERS_CACHE_TAG = 'books:best-sellers';
// The API caps the list at 24 books.
export const BEST_SELLERS_MAX = 24;

export type BestSellersResult =
  | { status: 'ok'; items: readonly BookCardItem[] }
  | { status: 'empty'; items: readonly [] }
  | { status: 'error'; items: readonly [] };

// GET /books/best-sellers: ranked by copies sold in the last 90 days (Delivered orders), best first. The API sends no
// sales numbers, so none are shown. A failure becomes a result the page can show instead of breaking.
export async function getBestSellers(
  limit: number = BEST_SELLERS_MAX,
  options: ServerClientOptions = {},
): Promise<BestSellersResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/books/best-sellers', {
      params: { query: { limit } },
      ...nextFetch({
        revalidate: BEST_SELLERS_REVALIDATE_SECONDS,
        tags: [BEST_SELLERS_CACHE_TAG],
      }),
    });
    if (result.error) throwIfError(result);
    const items = result.data ?? [];
    return items.length > 0 ? { status: 'ok', items } : { status: 'empty', items: [] };
  } catch {
    return { status: 'error', items: [] };
  }
}
