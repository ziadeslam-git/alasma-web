import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ToastProvider } from '@/shared/ui/toast';

import { AdminGate } from './admin-gate';
import { RequirePermission } from './require-permission';

type TestUser = {
  features: { key: string; isEnabled: boolean }[];
  fullName: string;
  permissions: string[];
  roles: string[];
};

const mocks = vi.hoisted(() => ({
  auth: { status: 'loading', user: null } as { status: string; user: TestUser | null },
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/books',
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/modules/auth', async () => {
  const actual = await vi.importActual<typeof import('@/modules/auth')>('@/modules/auth');

  return {
    ...actual,
    getAuthApi: () => ({ me: vi.fn() }),
    useAuth: () => ({ ...mocks.auth, logout: vi.fn(), setUser: vi.fn() }),
  };
});

const signIn = (roles: string[], permissions: string[]) => {
  mocks.auth = {
    status: 'authenticated',
    user: { features: [], fullName: 'Test Admin', permissions, roles },
  };
};

// The root layout provides the toasts in the real app.
const inApp = (node: ReactNode) => <ToastProvider label="toasts">{node}</ToastProvider>;

const page = inApp(
  <AdminGate>
    <RequirePermission permission="Books.Edit">
      <p>Books page</p>
    </RequirePermission>
  </AdminGate>,
);

const forbiddenTitle = messages.admin.forbidden.title;

describe('AdminGate', () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    mocks.auth = { status: 'loading', user: null };
  });

  it('shows the skeleton of the frame while the session loads', () => {
    render(page);

    expect(document.querySelector('[data-admin-state="loading"]')).toBeInTheDocument();
    expect(screen.queryByText('Books page')).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('sends a visitor to the login and keeps the path', async () => {
    mocks.auth = { status: 'anonymous', user: null };
    render(page);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login?next=%2Fadmin%2Fbooks'));
    expect(screen.queryByText('Books page')).not.toBeInTheDocument();
  });

  it('shows the 403 screen to a Customer, with no frame and no page', () => {
    signIn(['Customer'], []);
    render(page);

    expect(screen.getByRole('heading', { name: forbiddenTitle })).toBeInTheDocument();
    expect(document.querySelector('[data-admin-frame]')).not.toBeInTheDocument();
    expect(screen.queryByText('Books page')).not.toBeInTheDocument();
  });

  it('shows the frame with the 403 screen to an Admin without the page permission', () => {
    signIn(['Admin'], ['Orders.View']);
    render(page);

    expect(document.querySelector('[data-admin-frame]')).toBeInTheDocument();
    expect(screen.getByText('Test Admin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: forbiddenTitle })).toBeInTheDocument();
    expect(screen.queryByText('Books page')).not.toBeInTheDocument();
  });

  it('shows the page to an Admin who has the permission', () => {
    signIn(['Admin'], ['Books.Edit']);
    render(page);

    expect(screen.getByText('Books page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: forbiddenTitle })).not.toBeInTheDocument();
  });

  it('opens a page with anyOf when one permission matches', () => {
    signIn(['Admin'], ['Orders.View']);
    render(
      inApp(
        <AdminGate>
          <RequirePermission anyOf={['Books.Edit', 'Orders.View']}>
            <p>Shared page</p>
          </RequirePermission>
        </AdminGate>,
      ),
    );

    expect(screen.getByText('Shared page')).toBeInTheDocument();
  });
});
