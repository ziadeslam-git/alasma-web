'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Icon } from '@/shared/ui/icon';

import styles from './appbar.module.css';
import type { NavGroupId } from './nav-config';
import type { NavEntry } from './use-admin-nav';

const shell = messages.admin.shell;
const nav = messages.admin.nav;

type AppbarProps = {
  entries: readonly NavEntry[];
  onMore: () => void;
};

type TabProps = { entry: NavEntry | undefined; label: string; icon: ReactNode };

function Tab({ entry, icon, label }: TabProps) {
  if (entry?.href) {
    return (
      <Link
        aria-current={entry.isCurrent ? 'page' : undefined}
        className={styles.item}
        href={entry.href}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <span aria-disabled="true" className={styles.item} data-soon title={nav.soon}>
      {icon}
      {label}
    </span>
  );
}

// The phone bottom bar of the design: home, orders, the round + (new book), books, and "more" that opens the menu.
// A tab whose page is not built yet is inert.
export function Appbar({ entries, onMore }: AppbarProps) {
  const find = (id: NavGroupId) => entries.find((entry) => entry.id === id);

  return (
    <nav aria-label={shell.bottomNav} className={styles.appbar}>
      <Tab entry={find('overview')} icon={<Icon name="dash" size="lg" />} label={shell.home} />
      <Tab entry={find('orders')} icon={<Icon name="list" size="lg" />} label={nav.groups.orders} />
      <span className={`${styles.item} ${styles.fab}`} data-soon title={nav.soon}>
        <Icon name="plus" size="lg" />
        <span className={styles.srOnly}>{`${shell.newBook} - ${nav.soon}`}</span>{' '}
      </span>
      <Tab entry={find('books')} icon={<Icon name="book" size="lg" />} label={nav.groups.books} />
      <button className={styles.item} onClick={onMore} type="button">
        <Icon name="grid" size="lg" />
        {shell.more}
      </button>
    </nav>
  );
}
