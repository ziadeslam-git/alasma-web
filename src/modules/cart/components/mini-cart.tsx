'use client';
import Link from 'next/link';
import { useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Drawer } from '@/shared/ui/drawer';
import { Icon } from '@/shared/ui/icon';
import { useCart } from './use-cart';

export function MiniCart() {
  const [isOpen, setOpen] = useState(false);
  const { cart, isLoading, error } = useCart();
  return (
    <>
      <button aria-label={messages.site.header.cart} onClick={() => setOpen(true)} type="button">
        <Icon name="bag" />
        {cart ? <span>{formatNumber(cart.items.length)}</span> : null}
      </button>
      <Drawer
        closeLabel={messages.cart.close}
        onOpenChange={setOpen}
        open={isOpen}
        title={messages.cart.title}
      >
        {isLoading ? (
          <p>{messages.cart.loading}</p>
        ) : error instanceof ApiError &&
          error.status === 403 &&
          error.code === 'email_not_confirmed' ? (
          <UnconfirmedEmailBanner />
        ) : error ? (
          <p role="alert">
            {error instanceof ApiError ? getApiErrorMessage(error) : messages.cart.error}
          </p>
        ) : cart?.items.length ? (
          <ul>
            {cart.items.map((item) => (
              <li key={item.itemId}>
                {item.title} — {formatMoney(item.lineTotal)}
              </li>
            ))}
          </ul>
        ) : (
          <p>{messages.cart.empty}</p>
        )}
        <Link href={routes.cart} onClick={() => setOpen(false)}>
          {messages.cart.cartLink}
        </Link>
      </Drawer>
    </>
  );
}
