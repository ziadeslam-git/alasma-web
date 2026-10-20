import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  it('renders a GET search form with the q field and guest account links', () => {
    render(<SiteHeader />);

    const search = screen.getByRole('search');
    expect(search).toHaveAttribute('action', '/books');
    expect(search).toHaveAttribute('method', 'get');
    expect(screen.getByRole('searchbox', { name: messages.site.search.label })).toHaveAttribute(
      'name',
      'q',
    );
    expect(screen.getByRole('link', { name: messages.site.header.login })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: messages.site.header.register })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('keeps deferred header actions inert and makes the skip link first', () => {
    const { container } = render(<SiteHeader />);
    const firstFocusable = container.querySelector('a, button, input');

    expect(firstFocusable).toHaveAttribute('href', '#main-content');
    expect(document.querySelector('[data-feature="wishlist-heart"]')).toHaveAttribute('inert');
    expect(document.querySelector('[data-feature="cart-page"]')).toHaveAttribute('inert');
    expect(document.querySelector('[data-feature="notifications-center"]')).toHaveAttribute(
      'inert',
    );
  });

  it('uses an account slot instead of the guest links', () => {
    render(<SiteHeader accountArea={<span>Account menu</span>} />);

    expect(screen.getByText('Account menu')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: messages.site.header.login }),
    ).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SiteHeader />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
