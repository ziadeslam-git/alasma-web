import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { AccountMenu } from './account-menu';

const auth = vi.hoisted(() => ({
  status: 'authenticated',
  user: { fullName: 'Test Customer' } as { fullName: string } | null,
  logout: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => auth }));

describe('AccountMenu', () => {
  beforeEach(() => {
    auth.status = 'authenticated';
    auth.user = { fullName: 'Test Customer' };
    auth.logout.mockClear();
  });

  it('shows login and registration links for guests', () => {
    auth.status = 'anonymous';
    auth.user = null;
    render(<AccountMenu />);
    expect(screen.getByRole('link', { name: messages.site.header.login })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: messages.site.header.register })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('opens account links and signs out', async () => {
    const user = userEvent.setup();
    const { container } = render(<AccountMenu />);
    await user.click(screen.getByRole('button', { name: 'Test Customer' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('link', { name: messages.account.title })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(within(dialog).getByRole('link', { name: messages.account.orders })).toHaveAttribute(
      'href',
      '/account/orders',
    );
    expect(within(dialog).getByRole('link', { name: messages.account.addresses })).toHaveAttribute(
      'href',
      '/account/addresses',
    );
    expect(await axe(container)).toHaveNoViolations();
    await user.click(within(dialog).getByRole('button', { name: messages.account.logout }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });
});
