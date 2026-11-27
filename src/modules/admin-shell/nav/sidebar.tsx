'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';

import { NAV_GROUPS } from './nav-config';
import { filterNav } from './nav-filter';
import styles from './sidebar.module.css';

const text = messages.admin.nav;

// The dashboard (/admin) is current only on its own path; every other item is current on its path and below it.
const isCurrent = (href: string, pathname: string) =>
  pathname === href || (href !== routes.admin && pathname.startsWith(`${href}/`));

// The admin menu: only the sections this user can use. Built from GET /me (roles, permissions, features) and one config
// array. It renders in the AdminShell sidebar slot on wide screens and in the drawer on phones.
// With collapseInactive (the phone drawer) only the group of the current page starts open, like the design.
export function Sidebar({ collapseInactive = false }: { collapseInactive?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname() ?? '';
  const groups = useMemo(
    () =>
      user
        ? filterNav({
            features: user.features,
            permissions: user.permissions,
            roles: user.roles,
          })
        : [],
    [user],
  );

  return (
    <nav aria-label={text.label} className={styles.nav} data-admin-nav>
      {groups.map((group) => {
        const icon = NAV_GROUPS.find((entry) => entry.id === group.id)?.icon ?? 'grid';

        const hasCurrent = group.items.some(
          ({ item, isLocked }) => !isLocked && isCurrent(item.href, pathname),
        );

        return (
          <details
            className={styles.group}
            data-nav-group={group.id}
            key={group.id}
            open={!collapseInactive || hasCurrent}
          >
            <summary className={styles.summary}>
              <Icon name={icon} size="sm" />
              <span className={styles.groupLabel}>{text.groups[group.id]}</span>
              <span aria-hidden="true" className={styles.chevron}>
                <Icon name="chev-d" size="sm" />
              </span>
            </summary>
            <ul className={styles.list}>
              {group.items.map(({ item, isLocked }) => (
                <li key={item.href}>
                  {isLocked ? (
                    <span aria-disabled="true" className={`${styles.link} ${styles.locked}`}>
                      {text.items[item.labelKey]}
                      <span className={styles.badge} data-soon-badge>
                        {text.soon}
                      </span>
                    </span>
                  ) : (
                    <Link
                      aria-current={isCurrent(item.href, pathname) ? 'page' : undefined}
                      className={styles.link}
                      href={item.href}
                    >
                      {text.items[item.labelKey]}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </nav>
  );
}
