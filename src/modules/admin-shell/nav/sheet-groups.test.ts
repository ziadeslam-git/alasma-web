import { describe, expect, it } from 'vitest';

import { ADMIN_PERMISSIONS, ROLES } from '@/shared/config/admin-permissions';

import { filterNav } from './nav-filter';
import { buildSheetEntries } from './sheet-groups';
import type { NavEntry } from './use-admin-nav';

const entriesFor = (permissions: string[], roles: string[]): NavEntry[] =>
  filterNav({ features: [], permissions, roles }).map((group) => ({
    href: null,
    icon: 'grid',
    id: group.id,
    isCurrent: false,
    items: group.items,
    label: group.id,
  }));

describe('buildSheetEntries', () => {
  it('lists the frame groups in order with live links only for built pages', () => {
    const entries = entriesFor([ADMIN_PERMISSIONS.ordersView], [ROLES.superAdmin]);
    const sheet = buildSheetEntries(entries, '/admin/orders');

    expect(sheet.map((group) => group.id)).toEqual(['orders']);
    expect(sheet[0]?.isCurrent).toBe(true);

    const orders = sheet[0]?.lines.map((line) => [line.key, line.href]);

    expect(orders).toEqual([
      ['allOrders', '/admin/orders'],
      ['orderDetail', null],
      ['adminView', null],
      ['paymentReview', null],
      ['abandonedCarts', null],
    ]);
  });

  it('hides lines and groups the user has no permission for', () => {
    const sheet = buildSheetEntries(entriesFor([ADMIN_PERMISSIONS.ordersView], []), '/admin');

    expect(sheet.map((group) => group.id)).toEqual(['orders']);
    expect(sheet[0]?.lines.map((line) => line.key)).not.toContain('printedReports');
  });
});
