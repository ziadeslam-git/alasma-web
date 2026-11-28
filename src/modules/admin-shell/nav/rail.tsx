'use client';

import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';

import { RAIL_GROUP_IDS } from './nav-config';
import styles from './nav-bars.module.css';
import type { NavEntry } from './use-admin-nav';

const nav = messages.admin.nav;
const shell = messages.admin.shell;

// The slim icon rail of the design: six groups, then the store and the logout at the bottom.
export function Rail({
  entries,
  onLogout,
}: {
  entries: readonly NavEntry[];
  onLogout: () => void;
}) {
  const railEntries = RAIL_GROUP_IDS.map((id) => entries.find((entry) => entry.id === id)).filter(
    (entry): entry is NavEntry => entry !== undefined,
  );

  return (
    <aside aria-label={shell.quickNav} className={styles.rail}>
      {railEntries.map((entry) =>
        entry.href ? (
          <Link
            aria-current={entry.isCurrent ? 'page' : undefined}
            aria-label={entry.label}
            className={styles.railItem}
            data-nav-group={entry.id}
            href={entry.href}
            key={entry.id}
          >
            <Icon name={entry.icon} />
          </Link>
        ) : (
          <span
            className={styles.railItem}
            data-nav-group={entry.id}
            data-soon
            key={entry.id}
            title={nav.soon}
          >
            <Icon name={entry.icon} />
            <span className={styles.srOnly}>{`${entry.label} - ${nav.soon}`}</span>
          </span>
        ),
      )}
      <hr className={styles.railDivider} />
      <Link aria-label={shell.viewStore} className={styles.railItem} href={routes.home}>
        <Icon name="globe" />
      </Link>
      <button
        aria-label={shell.logout}
        className={styles.railItem}
        onClick={onLogout}
        type="button"
      >
        <Icon name="logout" />
      </button>
    </aside>
  );
}
