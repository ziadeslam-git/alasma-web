import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HeaderLink } from './header-link';

const nav = vi.hoisted(() => ({ pathname: '/books' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

describe('HeaderLink', () => {
  it('is current on its own path and below it', () => {
    nav.pathname = '/books/some-book';
    render(<HeaderLink href="/books" label="store" />);

    expect(screen.getByRole('link', { name: 'store' })).toHaveAttribute('aria-current', 'page');
  });

  it('matches the home link only on the exact path', () => {
    nav.pathname = '/books';
    render(<HeaderLink href="/" isExact label="home" />);

    expect(screen.getByRole('link', { name: 'home' })).not.toHaveAttribute('aria-current');
  });
});
