import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequireAuth } from './require-auth';

const mocks = vi.hoisted(() => ({ status: 'loading', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/account/orders',
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('../hooks/use-auth', () => ({ useAuth: () => ({ status: mocks.status }) }));

describe('RequireAuth', () => {
  it('waits for restoration', () => {
    mocks.status = 'loading';
    render(
      <RequireAuth>
        <span>Private</span>
      </RequireAuth>,
    );
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });
  it('redirects anonymous users to login', async () => {
    mocks.status = 'anonymous';
    render(
      <RequireAuth>
        <span>Private</span>
      </RequireAuth>,
    );
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/login?next=%2Faccount%2Forders'),
    );
  });
  it('renders authenticated content', () => {
    mocks.status = 'authenticated';
    render(
      <RequireAuth>
        <span>Private</span>
      </RequireAuth>,
    );
    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
