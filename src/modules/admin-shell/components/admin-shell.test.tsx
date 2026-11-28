import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ADMIN_FLAGS, ADMIN_PERMISSIONS } from '@/shared/config/admin-permissions';
import { ToastProvider } from '@/shared/ui/toast';

import { AdminShell } from './admin-shell';

type TestUser = {
  features: { key: string; isEnabled: boolean }[];
  fullName: string;
  permissions: string[];
  roles: string[];
};

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  pathname: '/admin/orders',
  user: null as TestUser | null,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('@/modules/auth', async () => {
  const actual = await vi.importActual<typeof import('@/modules/auth')>('@/modules/auth');

  return {
    ...actual,
    getAuthApi: () => ({ me: vi.fn() }),
    useAuth: () => ({ logout: mocks.logout, setUser: vi.fn(), user: mocks.user }),
  };
});

const shell = messages.admin.shell;
const nav = messages.admin.nav;
const allPermissions = Object.values(ADMIN_PERMISSIONS);
const allFlags = Object.values(ADMIN_FLAGS).map((key) => ({ key, isEnabled: true }));

function renderShell(roles: string[], permissions: string[]) {
  mocks.user = { features: allFlags, fullName: 'Test Admin', permissions, roles };

  return render(
    <ToastProvider label="toasts">
      <AdminShell>
        <h1>Page</h1>
      </AdminShell>
    </ToastProvider>,
  );
}

const topNav = () => screen.getByRole('navigation', { name: nav.label });

describe('AdminShell (the design frame)', () => {
  beforeEach(() => {
    mocks.pathname = '/admin/orders';
    mocks.logout.mockClear();
  });

  it('draws the eight pills of the design to the owner, the current one marked', () => {
    renderShell(['SuperAdmin'], allPermissions);

    const pills = [...topNav().children];

    expect(pills.map((pill) => pill.getAttribute('data-nav-group'))).toEqual([
      'overview',
      'books',
      'orders',
      'offers',
      'people',
      'content',
      'packages',
      'settings',
    ]);
    expect(within(topNav()).getByRole('link', { name: nav.groups.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(topNav()).getByRole('link', { name: nav.groups.overview })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('draws a group with no built page inert, with the soon hint and no link', () => {
    renderShell(['SuperAdmin'], allPermissions);

    const books = topNav().querySelector('[data-nav-group="books"]');

    expect(books?.tagName).toBe('SPAN');
    expect(books).toHaveAttribute('aria-disabled', 'true');
    expect(books).toHaveAttribute('title', nav.soon);
    expect(within(topNav()).queryByRole('link', { name: nav.groups.books })).toBeNull();
  });

  it('hides every group the user has no permission for', () => {
    renderShell(['Admin'], ['Orders.View']);

    expect([...topNav().children].map((pill) => pill.getAttribute('data-nav-group'))).toEqual([
      'orders',
    ]);
  });

  it('draws the rail: groups, then the store and the logout', async () => {
    renderShell(['SuperAdmin'], allPermissions);

    const rail = screen.getByRole('complementary', { name: shell.quickNav });

    expect(within(rail).getByRole('link', { name: nav.groups.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(rail).getByRole('link', { name: shell.viewStore })).toHaveAttribute('href', '/');

    await userEvent.click(within(rail).getByRole('button', { name: shell.logout }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it('shows the brand chip with the role and keeps search and alerts inert', () => {
    renderShell(['SuperAdmin'], allPermissions);

    expect(screen.getByText(shell.chipName)).toBeInTheDocument();
    expect(screen.getAllByText(messages.admin.roles.SuperAdmin).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: shell.search })).toBeDisabled();
    expect(screen.getByRole('button', { name: shell.alerts })).toBeDisabled();
  });

  it('draws the bottom bar and opens the sheet from "more"', async () => {
    renderShell(['SuperAdmin'], allPermissions);

    const bar = screen.getByRole('navigation', { name: shell.bottomNav });

    expect(within(bar).getByRole('link', { name: nav.groups.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(bar).getByText(new RegExp(shell.newBook))).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(within(bar).getByRole('button', { name: shell.more }));

    const sheet = await screen.findByRole('dialog', { name: shell.sheet });

    expect(within(sheet).getAllByText(nav.groups.settings).length).toBeGreaterThan(0);
    expect(within(sheet).getByRole('link', { name: nav.sheetItems.allOrders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // the frame's lists: a page without a screen is inert "soon", never a link
    expect(within(sheet).queryByRole('link', { name: nav.sheetItems.allBooks })).toBeNull();
    expect(within(sheet).getByText(nav.sheetItems.orderDetail).closest('a')).toBeNull();

    await userEvent.click(within(sheet).getByRole('button', { name: shell.closeSheet }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the same sheet from the menu button of the header', async () => {
    renderShell(['SuperAdmin'], allPermissions);

    await userEvent.click(screen.getByRole('button', { name: shell.openMenu }));

    expect(await screen.findByRole('dialog', { name: shell.sheet })).toBeInTheDocument();
  });

  it('renders the page inside the main landmark', () => {
    renderShell(['Admin'], ['Orders.View']);

    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Page' })).toBeVisible();
  });
});
