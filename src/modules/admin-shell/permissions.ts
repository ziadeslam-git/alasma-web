import { ROLES, type AdminPermission } from '@/shared/config/admin-permissions';

// One permission, or "any of these" (a page that two permissions can open).
export type PermissionRequirement = AdminPermission | { anyOf: readonly AdminPermission[] };

// Pure check on the permission names of GET /me. An empty anyOf grants nothing: "no permission is enough" must never
// open a page.
export function hasPermission(
  granted: readonly string[],
  required: PermissionRequirement,
): boolean {
  if (typeof required === 'string') {
    return granted.includes(required);
  }

  return required.anyOf.some((permission) => granted.includes(permission));
}

// A signed-in user whose only role is Customer is not staff and never gets the admin frame.
export function isStaff(roles: readonly string[]): boolean {
  return roles.some((role) => role !== ROLES.customer);
}
