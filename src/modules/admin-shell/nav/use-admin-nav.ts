'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import type { IconName } from '@/shared/icons/icon-registry';

import { BUILT_ADMIN_ROUTES, NAV_GROUPS, type NavGroupId } from './nav-config';
import { filterNav, type VisibleNavGroup, type VisibleNavItem } from './nav-filter';

const text = messages.admin.nav;

// The dashboard (/admin) is current only on its own path; every other page is current on its path and below it.
export const isCurrentPath = (href: string, pathname: string) =>
  pathname === href || (href !== routes.admin && pathname.startsWith(`${href}/`));

export const isLinkable = ({ item, isLocked }: VisibleNavItem) =>
  !isLocked && BUILT_ADMIN_ROUTES.has(item.href);

export type NavEntry = {
  id: NavGroupId;
  label: string;
  icon: IconName;
  // The page the entry opens: the first built, unlocked page of the group. null = nothing built yet (inert, "soon").
  href: string | null;
  isCurrent: boolean;
  items: VisibleNavItem[];
};

function toEntry(group: VisibleNavGroup, pathname: string): NavEntry {
  const icon = NAV_GROUPS.find((entry) => entry.id === group.id)?.icon ?? 'grid';
  const target = group.items.find(isLinkable);

  return {
    href: target?.item.href ?? null,
    icon,
    id: group.id,
    isCurrent: group.items.some(
      (entry) => isLinkable(entry) && isCurrentPath(entry.item.href, pathname),
    ),
    items: group.items,
    label: text.groups[group.id],
  };
}

// The admin menu the way the design shows it: eight groups, only those this user may see (GET /me roles,
// permissions and features), each with its target page or inert while nothing is built.
export function useAdminNav(): NavEntry[] {
  const { user } = useAuth();
  const pathname = usePathname() ?? '';

  return useMemo(() => {
    if (!user) {
      return [];
    }

    const groups = filterNav({
      features: user.features,
      permissions: user.permissions,
      roles: user.roles,
    });

    return groups.map((group) => toEntry(group, pathname));
  }, [pathname, user]);
}
