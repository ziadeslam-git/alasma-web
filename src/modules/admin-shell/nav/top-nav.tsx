import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';

import styles from './nav-bars.module.css';
import type { NavEntry } from './use-admin-nav';

const text = messages.admin.nav;

// The pill navigation of the design header: one pill per group. A group with a built page links to it; the others are
// inert with the soon hint.
export function TopNav({ entries }: { entries: readonly NavEntry[] }) {
  return (
    <nav aria-label={text.label} className={styles.tnav} data-admin-nav>
      {entries.map((entry) =>
        entry.href ? (
          <Link
            aria-current={entry.isCurrent ? 'page' : undefined}
            className={styles.pillLink}
            data-nav-group={entry.id}
            href={entry.href}
            key={entry.id}
          >
            {entry.label}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={styles.pillLink}
            data-nav-group={entry.id}
            data-soon
            key={entry.id}
            title={text.soon}
          >
            {entry.label}
            <span className={styles.srOnly}>{text.soon}</span>
          </span>
        ),
      )}
    </nav>
  );
}
