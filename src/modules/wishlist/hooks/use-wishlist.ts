'use client';

import { useEffect, useSyncExternalStore } from 'react';

import { useAuth } from '@/modules/auth';

import {
  ensureWishlistLoaded,
  resetWishlist,
  wishlistStore,
  type WishlistState,
} from '../state/wishlist-store';

// The shared wishlist state. A signed-in customer loads the ids once; a visitor or a signed-out customer clears them.
export function useWishlist(): WishlistState {
  const { status } = useAuth();
  const snapshot = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );

  useEffect(() => {
    if (status === 'authenticated') void ensureWishlistLoaded();
    else if (status === 'anonymous') resetWishlist();
  }, [status]);

  return snapshot;
}
