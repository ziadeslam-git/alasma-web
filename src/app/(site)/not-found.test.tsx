import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import SiteNotFound from './not-found';

describe('(site) not-found', () => {
  // The (site) layout already renders the header, <main> and footer: this page must add none of them (Task 75).
  it('renders the 404 content without a header, main or footer of its own', () => {
    const { container } = render(<SiteNotFound />);

    expect(container.querySelector('header, main, footer')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: messages.site.footer.notFoundTitle }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: messages.site.header.home })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: messages.site.header.store })).toHaveAttribute(
      'href',
      '/books',
    );
  });
});
