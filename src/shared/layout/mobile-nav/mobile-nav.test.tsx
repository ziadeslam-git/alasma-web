import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';
import messages from '@/i18n/messages/ar.json';

import { MobileNav } from './mobile-nav';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('MobileNav', () => {
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
    expect(document.querySelector('[data-feature="cart-page"]')).toHaveAttribute('inert');
    expect(document.querySelector('[data-feature="wishlist-heart"]')).toHaveAttribute('inert');
    expect(document.querySelector('[data-feature="account-area"]')).toHaveAttribute('inert');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MobileNav />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
