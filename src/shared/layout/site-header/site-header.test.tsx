import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getByRole('link', { name: messages.site.header.cart })).toHaveAttribute(
      'href',
      '/cart',
    );
    expect(document.querySelector('[data-feature="notifications-center"]')).toHaveAttribute(
      'inert',
    );
    expect(document.querySelector('[data-feature="publish-packages"]')).toHaveAttribute('inert');
    expect(screen.getByAltText(messages.site.brand)).toHaveAttribute('src', '/logo-alasma.svg');
    expect(screen.getByRole('link', { name: messages.site.header.authors })).toHaveAttribute(
      'href',
      '/authors',
    );
    expect(screen.getByRole('link', { name: messages.site.header.categories })).toHaveAttribute(
      'href',
      '/categories',
    );
    for (const feature of ['publish-packages']) {
      const entries = container.querySelectorAll(`[data-feature="${feature}"]`);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((entry) => {
        expect(entry).toHaveAttribute('inert');
        expect(entry.querySelector('a')).toBeNull();
        expect(entry).toHaveTextContent(messages.site.soon);
      });
    }
  });

  it('keeps unfinished destinations inert in the mobile menu', async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole('button', { name: messages.site.header.menu }));

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('link', { name: messages.site.header.authors }),
    ).toHaveAttribute('href', '/authors');
    expect(within(dialog).getByRole('link', { name: messages.site.footer.about })).toHaveAttribute(
      'href',
      '/pages/about',
    );
    expect(
      within(dialog).getByRole('link', { name: messages.site.header.categories }),
    ).toHaveAttribute('href', '/categories');
    for (const feature of ['publish-packages']) {
      const entries = dialog.querySelectorAll(`[data-feature="${feature}"]`);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((entry) => {
        expect(entry).toHaveAttribute('inert');
        expect(entry.querySelector('a')).toBeNull();
        expect(entry).toHaveTextContent(messages.site.soon);
      });
    }
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
