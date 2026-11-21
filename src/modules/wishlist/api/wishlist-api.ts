import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type WishlistItem = components['schemas']['WishlistItemDto'];
export type WishlistPage = components['schemas']['PagedResultOfWishlistItemDto'];

// The API caps the page at 48 books.
export const WISHLIST_PAGE_SIZE = 48;

export async function getWishlist(page = 1): Promise<WishlistPage> {
  const result = await getApiClient().GET('/api/v1/wishlist', {
    params: { query: { page, pageSize: WISHLIST_PAGE_SIZE } },
    cache: 'no-store',
  });
  if (!result.data) throw new Error('Missing wishlist response');
  return result.data;
}

// At most 500 ids, no paging: the hearts on the (cached, anonymous) public cards are painted from this list.
export async function getWishlistIds(): Promise<readonly number[]> {
  const result = await getApiClient().GET('/api/v1/wishlist/ids', { cache: 'no-store' });
  if (!result.data) throw new Error('Missing wishlist ids response');
  return result.data.bookIds;
}

// Both calls answer 204 when repeated, so a retry after a network failure is safe.
export async function addToWishlist(bookId: number): Promise<void> {
  await getApiClient().PUT('/api/v1/wishlist/{bookId}', { params: { path: { bookId } } });
}

export async function removeFromWishlist(bookId: number): Promise<void> {
  await getApiClient().DELETE('/api/v1/wishlist/{bookId}', { params: { path: { bookId } } });
}
