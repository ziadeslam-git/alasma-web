import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ADMIN_FLAGS, ADMIN_PERMISSIONS } from '@/shared/config/admin-permissions';

import { Sidebar } from './sidebar';

type TestUser = {
  features: { key: string; isEnabled: boolean }[];
  permissions: string[];
  roles: string[];
};

const mocks = vi.hoisted(() => ({
  pathname: '/admin/orders',
  user: null as TestUser | null,
}));

vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }));
vi.mock('@/modules/auth', () => ({ useAuth: () => ({ user: mocks.user }) }));

const labels = messages.admin.nav.items;
const allPermissions = Object.values(ADMIN_PERMISSIONS);
const flags = (offKeys: string[] = []) =>
  Object.values(ADMIN_FLAGS).map((key) => ({ key, isEnabled: !offKeys.includes(key) }));

describe('Sidebar', () => {
  beforeEach(() => {
    mocks.pathname = '/admin/orders';
  });

  it('shows the default Admin two items only: Orders and Payments', () => {
    mocks.user = {
      features: flags(),
      permissions: ['Orders.View', 'Orders.AddNote', 'Orders.RaiseAlert'],
      roles: ['Admin'],
    };
    render(<Sidebar />);

    const nav = screen.getByRole('navigation', { name: messages.admin.nav.label });

    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([labels.orders, labels.payments]);
    expect(within(nav).queryByText(labels.dashboard)).not.toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    mocks.user = { features: flags(), permissions: ['Orders.View'], roles: ['Admin'] };
    render(<Sidebar />);

    expect(screen.getByRole('link', { name: labels.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: labels.payments })).not.toHaveAttribute('aria-current');
  });

  it('shows a SuperAdmin 26 links and no Developer item', () => {
    mocks.user = { features: flags(), permissions: allPermissions, roles: ['SuperAdmin'] };
    render(<Sidebar />);

    expect(screen.getAllByRole('link')).toHaveLength(26);
    expect(screen.queryByText(labels.dev)).not.toBeInTheDocument();
  });

  it('shows a Developer the Developer item', () => {
    mocks.user = { features: flags(), permissions: allPermissions, roles: ['Developer'] };
    render(<Sidebar />);

    expect(screen.getAllByRole('link')).toHaveLength(27);
    expect(screen.getByRole('link', { name: labels.dev })).toHaveAttribute('href', '/admin/dev');
  });

  it('shows the owner a switched-off section faded with the soon badge and no link', () => {
    mocks.user = {
      features: flags(['Marketing.Banners']),
      permissions: allPermissions,
      roles: ['SuperAdmin'],
    };
    render(<Sidebar />);

    expect(
      screen.queryByRole('link', { name: new RegExp(labels.banners) }),
    ).not.toBeInTheDocument();

    const locked = screen.getByText(labels.banners, { selector: 'span[aria-disabled="true"]' });

    expect(within(locked).getByText(messages.admin.nav.soon)).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(25);
  });

  it('hides a switched-off section from an Admin', () => {
    mocks.user = {
      features: flags(['Marketing.Banners']),
      permissions: ['Content.Manage'],
      roles: ['Admin'],
    };
    render(<Sidebar />);

    expect(screen.queryByText(labels.banners)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      labels.quotes,
      labels.events,
    ]);
  });

  it('opens every group by default and only the current one with collapseInactive', () => {
    mocks.user = { features: flags(), permissions: allPermissions, roles: ['SuperAdmin'] };

    const { container, rerender } = render(<Sidebar />);

    expect(container.querySelectorAll('details:not([open])')).toHaveLength(0);

    rerender(<Sidebar collapseInactive />);

    expect(container.querySelector('[data-nav-group="operations"]')).toHaveAttribute('open');
    expect(container.querySelector('[data-nav-group="catalog"]')).not.toHaveAttribute('open');
  });

  it('renders no group for a user without a session user', () => {
    mocks.user = null;
    render(<Sidebar />);

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
