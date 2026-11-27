import { ROLES } from '@/shared/config/admin-permissions';

import { hasPermission } from '../permissions';
import { NAV_GROUPS, NAV_ITEMS, type NavGroupId, type NavItem } from './nav-config';

export type NavContext = {
  roles: readonly string[];
  permissions: readonly string[];
  // GET /me features[]: the owner also receives the switched-off flags, an Admin only the enabled ones.
  features: readonly { key: string; isEnabled: boolean }[];
};

export type VisibleNavItem = { item: NavItem; isLocked: boolean };
export type VisibleNavGroup = { id: NavGroupId; items: VisibleNavItem[] };

// The owner roles see the switched-off sections faded instead of not at all.
const isOwner = (roles: readonly string[]) =>
  roles.includes(ROLES.superAdmin) || roles.includes(ROLES.developer);

// null = hidden, otherwise whether the item is locked (faded, not clickable).
function resolve(item: NavItem, context: NavContext): VisibleNavItem | null {
  if (item.role !== undefined && !context.roles.includes(item.role)) {
    return null;
  }

  if (item.permission !== undefined && !hasPermission(context.permissions, item.permission)) {
    return null;
  }

  if (item.flag === undefined) {
    return { item, isLocked: false };
  }

  const flag = context.features.find((feature) => feature.key === item.flag);

  if (flag?.isEnabled) {
    return { item, isLocked: false };
  }

  // Switched off: only the owner sees it, and only when the API sent the flag at all.
  return flag && isOwner(context.roles) ? { item, isLocked: true } : null;
}

// The groups and items this user may see, in menu order. Empty groups are left out.
export function filterNav(
  context: NavContext,
  items: readonly NavItem[] = NAV_ITEMS,
): VisibleNavGroup[] {
  return NAV_GROUPS.map((group) => ({
    id: group.id,
    items: items
      .filter((item) => item.group === group.id)
      .map((item) => resolve(item, context))
      .filter((entry): entry is VisibleNavItem => entry !== null),
  })).filter((group) => group.items.length > 0);
}
