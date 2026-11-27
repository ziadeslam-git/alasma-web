'use client';

import type { ReactNode } from 'react';

import type { AdminPermission } from '@/shared/config/admin-permissions';

import { useCan } from '../hooks/use-can';
import { ForbiddenState } from './forbidden-state';

export type RequirePermissionProps = {
  children: ReactNode;
} & (
  | { permission: AdminPermission; anyOf?: never }
  | { anyOf: readonly AdminPermission[]; permission?: never }
);

// Wraps an admin page: the page (and any data it loads) renders only when the user has the permission, or any one of
// the list. Otherwise the 403 screen replaces it. Children are not even created, so nothing loads behind the guard.
export function RequirePermission({ anyOf, children, permission }: RequirePermissionProps) {
  const isAllowed = useCan(permission === undefined ? { anyOf: anyOf ?? [] } : permission);

  return isAllowed ? children : <ForbiddenState />;
}
