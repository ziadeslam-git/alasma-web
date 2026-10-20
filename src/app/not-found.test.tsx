import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import NotFound from './not-found';

describe('NotFound', () => {
  it('renders the not-found heading and navigation links', () => {
    render(<NotFound />);
    // the site header also has a home and a store link, so look inside the page content only
    const page = within(screen.getByRole('main'));

    expect(page.getByRole('link', { name: messages.site.header.home })).toHaveAttribute(
      'href',
      '/',
    );
    expect(page.getByRole('link', { name: messages.site.header.store })).toHaveAttribute(
      'href',
      '/books',
    );
  });
});
