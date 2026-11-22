import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';
import messages from '@/i18n/messages/ar.json';

import { MobileNav } from './mobile-nav';

const nav = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

describe('MobileNav', () => {
  beforeEach(() => {
    nav.pathname = '/';
  });

  it('links to home and store, marks the current path, and makes deferred areas inert', () => {
    render(<MobileNav />);

    expect(screen.getByRole('link', { name: messages.site.header.home })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: messages.site.header.store })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(screen.getByRole('link', { name: messages.site.header.cart })).toHaveAttribute(
      'href',
      '/cart',
    );
    expect(screen.getByRole('link', { name: messages.site.header.wishlist })).toHaveAttribute(
      'href',
      '/account/wishlist',
    );
    expect(screen.getByRole('link', { name: messages.account.title })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('marks the account item current on account pages and the wishlist item on the wishlist', () => {
    nav.pathname = '/account/orders';
    const { unmount } = render(<MobileNav />);
    expect(screen.getByRole('link', { name: messages.account.title })).toHaveAttribute(
      'aria-current',
      'page',
    );
    unmount();

    nav.pathname = '/account/wishlist';
    render(<MobileNav />);
    expect(screen.getByRole('link', { name: messages.site.header.wishlist })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: messages.account.title })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders the cart badge slot inside the cart item', () => {
    render(
      <MobileNav
        cartBadge={
          <span aria-hidden="true" data-testid="badge">
            3
          </span>
        }
      />,
    );

    expect(screen.getByRole('link', { name: messages.site.header.cart })).toContainElement(
      screen.getByTestId('badge'),
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MobileNav />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
