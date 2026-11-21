import { addToWishlist, getWishlistIds, removeFromWishlist } from '../api/wishlist-api';

// The ids of the signed-in customer's saved books, shared by every heart on the page. Public book cards are cached
// and anonymous, so the hearts are painted from GET /wishlist/ids. Memory only: nothing is written to web storage.
export type WishlistStatus = 'idle' | 'loading' | 'ready' | 'error';

export type WishlistState = {
  status: WishlistStatus;
  ids: ReadonlySet<number>;
  pending: ReadonlySet<number>;
};

const initialState: WishlistState = { status: 'idle', ids: new Set(), pending: new Set() };

let state: WishlistState = initialState;
let generation = 0;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: WishlistState) {
  state = next;
  listeners.forEach((listener) => listener());
}

const withId = (set: ReadonlySet<number>, id: number, present: boolean) => {
  const next = new Set(set);
  if (present) next.add(id);
  else next.delete(id);
  return next;
};

export const wishlistStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
  getServerSnapshot: () => initialState,
};

// One request per session however many hearts are mounted.
export function ensureWishlistLoaded(): Promise<void> {
  if (state.status === 'ready') return Promise.resolve();
  if (loading) return loading;
  const mine = generation;
  publish({ ...state, status: 'loading' });
  loading = getWishlistIds()
    .then((ids) => {
      if (mine !== generation) return;
      publish({ ...state, status: 'ready', ids: new Set(ids) });
    })
    .catch(() => {
      if (mine !== generation) return;
      publish({ ...state, status: 'error' });
    })
    .finally(() => {
      if (mine === generation) loading = null;
    });
  return loading;
}

// Sign-out or another customer: nothing of the previous session may stay.
export function resetWishlist() {
  generation += 1;
  loading = null;
  if (state !== initialState) publish(initialState);
}

// Optimistic: the id changes at once, the request follows, and a failure puts the id back before the error is thrown.
export async function setWishlisted(bookId: number, wanted: boolean): Promise<void> {
  if (state.pending.has(bookId)) return;
  const mine = generation;
  const hasPrevious = state.ids.has(bookId);
  publish({
    ...state,
    ids: withId(state.ids, bookId, wanted),
    pending: withId(state.pending, bookId, true),
  });
  try {
    await (wanted ? addToWishlist(bookId) : removeFromWishlist(bookId));
  } catch (error) {
    if (mine === generation) {
      publish({ ...state, ids: withId(state.ids, bookId, hasPrevious) });
    }
    throw error;
  } finally {
    if (mine === generation) {
      publish({ ...state, pending: withId(state.pending, bookId, false) });
    }
  }
}
