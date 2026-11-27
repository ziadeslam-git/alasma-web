'use client';

import { useAuth } from '@/modules/auth';

import { hasPermission, type PermissionRequirement } from '../permissions';

// For a single button or link: hide it when this returns false (disable it with a tooltip only where hiding would
// confuse). The permissions come from the signed-in user in React state; nothing is stored.
export function useCan(required: PermissionRequirement): boolean {
  const { status, user } = useAuth();

  if (status !== 'authenticated' || !user) {
    return false;
  }

  return hasPermission(user.permissions, required);
}
