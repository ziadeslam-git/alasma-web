'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth';
import { UnconfirmedEmailBanner } from '@/modules/account';
import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';
import { useToast } from '@/shared/ui/toast';
import { addBook } from '../api/cart-api';
import { notifyCartChanged } from '../cart-events';

export function AddToCartButton({
  bookId,
  title,
  className,
  showText = false,
}: {
  bookId: number;
  title: string;
  className?: string;
  showText?: boolean;
}) {
  const { status } = useAuth();
  const { show } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, setPending] = useState(false);
  const [isEmailUnconfirmed, setEmailUnconfirmed] = useState(false);
  async function add() {
    if (status === 'anonymous') {
      router.push(`${routes.login}?next=${encodeURIComponent(pathname || routes.home)}`);
      return;
    }
    if (status !== 'authenticated' || isPending) return;
    setPending(true);
    setEmailUnconfirmed(false);
    try {
      await addBook(bookId);
      notifyCartChanged();
      show(messages.cart.added, { kind: 'success', closeLabel: messages.cart.close });
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.code === 'email_not_confirmed'
      ) {
        setEmailUnconfirmed(true);
      }
      const message = error instanceof ApiError ? getApiErrorMessage(error) : messages.cart.error;
      const availability =
        error instanceof ApiError && error.availableQuantity !== undefined
          ? ` ${messages.cart.available.replace('{count}', formatNumber(error.availableQuantity))}`
          : '';
      show(message + availability, { kind: 'error', closeLabel: messages.cart.close });
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        aria-label={messages.catalog.addToCart.replace('{title}', title)}
        className={className}
        disabled={status === 'loading' || isPending}
        onClick={() => void add()}
        type="button"
      >
        <Icon name="bag" />
        {showText ? <span>{messages.catalog.detail.actions.addToCart}</span> : null}
      </button>
      {isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : null}
    </>
  );
}
