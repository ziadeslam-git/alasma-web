import { describe, expect, it } from 'vitest';

import { ADMIN_FLAGS, ADMIN_PERMISSIONS } from '@/shared/config/admin-permissions';

import { NAV_ITEMS } from './nav-config';
import { filterNav, type NavContext } from './nav-filter';

const allPermissions = Object.values(ADMIN_PERMISSIONS);
const allFlagsOn = Object.values(ADMIN_FLAGS).map((key) => ({ key, isEnabled: true }));
const flagsWith = (offKey: string) =>
  Object.values(ADMIN_FLAGS).map((key) => ({ key, isEnabled: key !== offKey }));

const hrefs = (context: NavContext) =>
  filterNav(context).flatMap((group) => group.items.map(({ item }) => item.href));

const defaultAdmin: NavContext = {
  features: allFlagsOn,
  permissions: ['Orders.View', 'Orders.AddNote', 'Orders.RaiseAlert'],
  roles: ['Admin'],
};

describe('filterNav', () => {
  it('has 27 items in the config: 26 for the owner plus the developer item', () => {
    expect(NAV_ITEMS).toHaveLength(27);
  });

  it('shows the default Admin Orders and Payments only, not the dashboard', () => {
    expect(hrefs(defaultAdmin)).toEqual(['/admin/orders', '/admin/payments']);
  });

  it('shows a SuperAdmin everything except the Developer item', () => {
    const result = hrefs({
      features: allFlagsOn,
      permissions: allPermissions,
      roles: ['SuperAdmin'],
    });

    expect(result).toHaveLength(26);
    expect(result).not.toContain('/admin/dev');
    expect(result).toContain('/admin/permissions');
  });

  it('shows a Developer all 27 items including the Developer item', () => {
    const result = hrefs({
      features: allFlagsOn,
      permissions: allPermissions,
      roles: ['Developer'],
    });

    expect(result).toHaveLength(27);
    expect(result).toContain('/admin/dev');
  });

  it('shows nothing for a user without permissions and leaves out empty groups', () => {
    expect(filterNav({ features: allFlagsOn, permissions: [], roles: ['Admin'] })).toEqual([]);
  });

  it('never shows the Developer item to an Admin that has every permission', () => {
    const result = hrefs({ features: allFlagsOn, permissions: allPermissions, roles: ['Admin'] });

    expect(result).not.toContain('/admin/dev');
  });

  it('hides a section whose permission is missing even when its flag is on', () => {
    const result = hrefs({ ...defaultAdmin, permissions: ['Content.Manage'] });

    expect(result).toEqual(['/admin/quotes', '/admin/banners', '/admin/events']);
  });

  it('shows the owner a switched-off flag as a locked item', () => {
    const groups = filterNav({
      features: flagsWith('Marketing.Banners'),
      permissions: allPermissions,
      roles: ['SuperAdmin'],
    });
    const banners = groups
      .flatMap((group) => group.items)
      .find((entry) => entry.item.href === '/admin/banners');
    const quotes = groups
      .flatMap((group) => group.items)
      .find((entry) => entry.item.href === '/admin/quotes');

    expect(banners?.isLocked).toBe(true);
    expect(quotes?.isLocked).toBe(false);
  });

  it('hides a switched-off flag from an Admin', () => {
    const result = hrefs({
      features: flagsWith('Marketing.Banners'),
      permissions: ['Content.Manage'],
      roles: ['Admin'],
    });

    expect(result).toEqual(['/admin/quotes', '/admin/events']);
  });

  it('hides an item whose flag the API did not send, from the owner too', () => {
    const features = allFlagsOn.filter((flag) => flag.key !== 'Marketing.Banners');

    expect(hrefs({ features, permissions: ['Content.Manage'], roles: ['SuperAdmin'] })).toEqual([
      '/admin/quotes',
      '/admin/events',
    ]);
    expect(hrefs({ features, permissions: ['Content.Manage'], roles: ['Admin'] })).toEqual([
      '/admin/quotes',
      '/admin/events',
    ]);
  });

  it('keeps the eight groups of the design in their order', () => {
    const groups = filterNav({
      features: allFlagsOn,
      permissions: allPermissions,
      roles: ['Developer'],
    });

    expect(groups.map((group) => group.id)).toEqual([
      'overview',
      'books',
      'orders',
      'offers',
      'people',
      'content',
      'packages',
      'settings',
    ]);
  });
});
