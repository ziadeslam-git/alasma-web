import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';

import styles from './admin-orders.module.css';

const copy = messages.admin.orders;

type SubNavItem = {
  // null: the screen is not built yet, so the pill is drawn inert. Give it its path when its task lands.
  href: string | null;
  key: keyof typeof copy.subNav;
};

// design/AdmOrders.dc.html .sub-t, in the frame's order. Only the list exists today.
const ITEMS: readonly SubNavItem[] = [
  { href: `${routes.admin}/orders`, key: 'all' },
  { href: null, key: 'details' },
  { href: null, key: 'adminView' },
  { href: null, key: 'payments' },
  { href: null, key: 'shipping' },
  { href: null, key: 'carts' },
  { href: null, key: 'reservations' },
  { href: null, key: 'prints' },
];

export function OrdersSubNav() {
  return (
    <nav aria-label={copy.subNavLabel} className={styles.subNav}>
      {ITEMS.map(({ href, key }) =>
        href ? (
          <Link
            key={key}
            aria-current={key === 'all' ? 'page' : undefined}
            className={styles.subLink}
            href={href}
          >
            {copy.subNav[key]}
          </Link>
        ) : (
          <span
            key={key}
            aria-disabled="true"
            className={`${styles.subLink} ${styles.subSoon}`}
            title={copy.soon}
          >
            {copy.subNav[key]}
            <span className={styles.srOnly}>{` (${copy.soon})`}</span>
          </span>
        ),
      )}
    </nav>
  );
}
