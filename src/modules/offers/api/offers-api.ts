import type { BookCardItem } from '@/modules/catalog';
import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
  type components,
} from '@/shared/lib/api';

export type Bundle = components['schemas']['BundleDto'];

export const OFFERS_REVALIDATE_SECONDS = 300;
export const BUNDLES_CACHE_TAG = 'bundles';
export const DISCOUNTED_CACHE_TAG = 'books:discounted';
export const BUNDLES_PAGE_SIZE = 20;
export const DISCOUNTED_PAGE_SIZE = 8;

export type BundlesResult =
  | { status: 'ok'; items: readonly Bundle[] }
  | { status: 'empty'; items: readonly [] }
  | { status: 'error'; items: readonly [] };

export type DiscountedBooksResult =
  | { status: 'ok'; items: readonly BookCardItem[] }
  | { status: 'empty'; items: readonly [] }
  | { status: 'error'; items: readonly [] };

// GET /bundles: the active bundles inside their dates; the price, the saving and the stock status are the API's.
export async function getBundles(options: ServerClientOptions = {}): Promise<BundlesResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/bundles', {
      params: { query: { page: 1, pageSize: BUNDLES_PAGE_SIZE } },
      ...nextFetch({ revalidate: OFFERS_REVALIDATE_SECONDS, tags: [BUNDLES_CACHE_TAG] }),
    });
    if (result.error) throwIfError(result);
    const items = result.data?.items ?? [];
    return items.length > 0 ? { status: 'ok', items } : { status: 'empty', items: [] };
  } catch {
    return { status: 'error', items: [] };
  }
}

// The newest discounted books (GET /books?hasDiscount=true).
export async function getDiscountedBooks(
  options: ServerClientOptions = {},
): Promise<DiscountedBooksResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/books', {
      params: {
        query: { hasDiscount: true, sort: 'newest', page: 1, pageSize: DISCOUNTED_PAGE_SIZE },
      },
      ...nextFetch({ revalidate: OFFERS_REVALIDATE_SECONDS, tags: [DISCOUNTED_CACHE_TAG] }),
    });
    if (result.error) throwIfError(result);
    const items = result.data?.items ?? [];
    return items.length > 0 ? { status: 'ok', items } : { status: 'empty', items: [] };
  } catch {
    return { status: 'error', items: [] };
  }
}
