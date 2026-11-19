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
    // Task 72: the wishlist heart is soon, so the header leaves it out instead of showing it dimmed
    expect(container.querySelector('header [data-feature="wishlist-heart"]')).toBeNull();
    expect(screen.queryByLabelText(messages.site.header.wishlist)).toBeNull();
    expect(screen.getByRole('link', { name: messages.site.header.cart })).toHaveAttribute(
      'href',
      '/cart',
    );
    // the bell and the language switch are not in the design's header, so they are not rendered at all
    expect(document.querySelector('[data-feature="notifications-center"]')).toBeNull();
    expect(document.querySelector('[data-feature="language-switch-en"]')).toBeNull();
    expect(screen.getByAltText(messages.site.brand)).toHaveAttribute('src', '/logo-alasma.svg');
    expect(screen.getByRole('link', { name: messages.site.header.authors })).toHaveAttribute(
      'href',
      '/authors',
    );
    expect(screen.getByRole('link', { name: messages.site.header.categories })).toHaveAttribute(
      'href',
      '/categories',
    );
    // Task 62: soon destinations are left out of the header navigation, not shown dimmed with a badge
    const nav = screen.getByRole('navigation', { name: messages.site.header.home });
    expect(nav.querySelector('[data-feature]')).toBeNull();
    expect(nav.querySelector('[data-soon-badge]')).toBeNull();
    for (const label of [
      messages.site.header.bestSellers,
      messages.site.header.offers,
      messages.site.header.events,
      messages.site.header.publishPackages,
    ]) {
      expect(within(nav).queryByText(label)).toBeNull();
    }
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      messages.site.header.home,
      messages.site.header.store,
      messages.site.header.authors,
      messages.site.header.categories,
    ]);
  });

  it('leaves unfinished destinations out of the mobile menu', async () => {
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
    // Task 62: the menu leaves soon destinations out too
    expect(dialog.querySelector('[data-feature="publish-packages"]')).toBeNull();
    expect(within(dialog).queryByText(messages.site.header.publishPackages)).toBeNull();
  });

  it('puts the menuAccount slot at the top of the mobile menu, and adds nothing without it (Task 75)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteHeader menuAccount={<a href="/login">guest entry</a>} />);
    await user.click(screen.getByRole('button', { name: messages.site.header.menu }));
    const links = within(screen.getByRole('dialog')).getAllByRole('link');
    expect(links[0]).toHaveTextContent('guest entry');
    unmount();

    render(<SiteHeader />);
    await user.click(screen.getByRole('button', { name: messages.site.header.menu }));
    expect(within(screen.getByRole('dialog')).queryByText('guest entry')).toBeNull();
  });

  it('has no account link in the mobile menu unless a slot adds it, and puts menuFooter at the bottom (Task 84)', async () => {
    const user = userEvent.setup();
    render(<SiteHeader menuFooter={<button type="button">footer action</button>} />);
    await user.click(screen.getByRole('button', { name: messages.site.header.menu }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).queryByRole('link', { name: messages.account.title })).toBeNull();
    const links = within(dialog).getAllByRole('link');
    const footer = within(dialog).getByRole('button', { name: 'footer action' });
    expect(
      links[links.length - 1]!.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
