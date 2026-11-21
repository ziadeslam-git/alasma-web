'use client';

import { useRouter } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Icon } from '@/shared/ui/icon';
import { useToast } from '@/shared/ui/toast';

import { useWishlist } from '../hooks/use-wishlist';
import { setWishlisted } from '../state/wishlist-store';

export type WishlistHeartProps = {
  bookId: number;
  title: string;
  className?: string;
};

// The heart on book cards and the book page. A visitor is sent to sign in and comes back to the same page; a
// signed-in customer toggles the book at once and the change is undone with a message if the API refuses.
export function WishlistHeart({ bookId, title, className }: WishlistHeartProps) {
  const text = messages.wishlist;
  const { status } = useAuth();
  const wishlist = useWishlist();
  const { show } = useToast();
  const router = useRouter();

  const isSaved = status === 'authenticated' && wishlist.ids.has(bookId);
  const isPending = wishlist.pending.has(bookId);
  // The saved state is unknown until the ids arrive, so the button waits instead of showing a wrong heart.
  const isWaiting =
    status === 'loading' ||
    (status === 'authenticated' && (wishlist.status === 'idle' || wishlist.status === 'loading'));

  async function toggle() {
    if (status === 'anonymous') {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`${routes.login}?next=${encodeURIComponent(here)}`);
      return;
    }
    if (status !== 'authenticated' || isPending) return;
    try {
      await setWishlisted(bookId, !isSaved);
    } catch (error) {
      const message = error instanceof ApiError ? getApiErrorMessage(error) : text.toggleError;
      show(message, { kind: 'error', closeLabel: text.close });
    }
  }

  return (
    <button
      aria-label={text.toggle.replace('{title}', title)}
      aria-pressed={isSaved}
      className={className}
      disabled={isWaiting || isPending}
      onClick={() => void toggle()}
      type="button"
    >
      <Icon name={isSaved ? 'heart-f' : 'heart'} size="sm" />
    </button>
  );
}
