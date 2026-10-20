import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import NotFound from './not-found';

describe('NotFound', () => {
  it('renders the not-found heading and navigation links', () => {
    render(<NotFound />);
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
