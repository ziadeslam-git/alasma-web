import type { Metadata } from 'next';

import { MAX_PAGE } from '@/modules/catalog';
import { WishlistView } from '@/modules/wishlist';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Customer data is read in the browser with the access token, so the page itself carries nothing to cache.
export const dynamic = 'force-dynamic';

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const n = Number(query.page);
  const page = Number.isInteger(n) && n >= 1 && n <= MAX_PAGE ? n : 1;
  return <WishlistView key={page} page={page} />;
}
