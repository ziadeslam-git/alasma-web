import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { AccountNav } from './account-nav';

const nav = vi.hoisted(() => ({ pathname: '/account' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

describe('AccountNav', () => {
  beforeEach(() => {
    nav.pathname = '/account';
  });

  it('marks only the overview current on /account', () => {
    render(<AccountNav />);

    expect(screen.getByRole('link', { name: messages.account.overview })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: messages.account.orders })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks a section current on its own pages', () => {
    nav.pathname = '/account/orders/15';
    render(<AccountNav />);

    expect(screen.getByRole('link', { name: messages.account.orders })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: messages.account.overview })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('shows the notifications entry as inert and renders the footer slot', () => {
    render(<AccountNav footer={<p>footer</p>} />);

    expect(screen.queryByRole('link', { name: messages.account.notifications })).toBeNull();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AccountNav />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
