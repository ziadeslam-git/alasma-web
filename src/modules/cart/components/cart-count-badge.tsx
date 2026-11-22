'use client';

import { formatNumber } from '@/shared/lib/format';

import styles from './cart.module.css';
import { useCart } from './use-cart';

// The number of books in the cart (the sum of the line quantities) for the phone app bar; nothing while the cart is
// empty or not loaded.
export function CartCountBadge() {
  const { cart } = useCart();
  const bookCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

  if (bookCount <= 0) return null;

  return (
    <span aria-hidden="true" className={styles.barCount}>
      {formatNumber(bookCount)}
    </span>
  );
}
