'use client';

import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { useUrlState } from '@/shared/hooks/use-url-state';

import { STATUS_KEY, STATUS_TABS } from '../lib/orders-filters';
import styles from './admin-orders.module.css';

const copy = messages.admin.orders;
const statusLabels = messages.admin.status.order;

// The quick status filter: pills like the sub-navigation of the design (.sub-t). A tab is a link, so it works with
// the keyboard and the back button; the status lives in the URL.
export function OrdersStatusTabs({ active }: { active: string | undefined }) {
  const url = useUrlState();

  return (
    <nav aria-label={copy.tabsLabel} className={styles.tabs}>
      <Link
        aria-current={active ? undefined : 'page'}
        className={styles.tab}
        href={url.hrefFor({ [STATUS_KEY]: null })}
        replace
      >
        {copy.tabAll}
      </Link>
      {STATUS_TABS.map((status) => (
        <Link
          key={status}
          aria-current={active === status ? 'page' : undefined}
          className={styles.tab}
          href={url.hrefFor({ [STATUS_KEY]: status })}
          replace
        >
          {statusLabels[status]}
        </Link>
      ))}
    </nav>
  );
}
