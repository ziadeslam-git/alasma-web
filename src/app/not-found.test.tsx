import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

// The real (site) layout is an async server component (it loads the feature flags), which jsdom cannot render. The
// stub stands in for its shell: one header, one <main> around the children, one footer.
vi.mock('./(site)/layout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <>
      <header>site header</header>
      <main>{children}</main>
      <footer>site footer</footer>
    </>
  ),
}));

import NotFound from './not-found';

describe('NotFound', () => {
  it('renders the not-found heading and navigation links inside the single site shell', () => {
    render(<NotFound />);
    // the site header also has a home and a store link, so look inside the page content only
    const page = within(screen.getByRole('main'));

    // the content brings no shell of its own: exactly one header, one main and one footer in total (Task 75)
    expect(document.querySelectorAll('header')).toHaveLength(1);
    expect(document.querySelectorAll('main')).toHaveLength(1);
    expect(document.querySelectorAll('footer')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      page.getByRole('heading', { level: 1, name: messages.site.footer.notFoundTitle }),
    ).toBeVisible();
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
