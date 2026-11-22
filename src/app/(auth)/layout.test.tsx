import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuthLayout from './layout';

const shell = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock('@/shared/layout/site-shell', () => ({
  SiteShell: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
    shell.props = props;
    return <div>{children}</div>;
  },
}));
vi.mock('@/modules/account', () => ({
  AccountMenu: () => <i data-testid="account-menu" />,
  GuestMenuLinks: () => <i />,
  SignedInMenuLinks: () => <i />,
  MenuLogout: () => <i />,
}));
vi.mock('@/modules/cart', () => ({ MiniCart: () => <i data-testid="mini-cart" /> }));
vi.mock('@/modules/newsletter', () => ({ NewsletterForm: () => <i /> }));

describe('auth layout', () => {
  it('gives the header the same account menu, cart and mobile account links as the site pages (Task 10)', () => {
    render(
      <AuthLayout>
        <p>login form</p>
      </AuthLayout>,
    );

    expect(screen.getByText('login form')).toBeInTheDocument();
    for (const slot of ['accountArea', 'cart', 'menuAccount', 'menuFooter', 'newsletter']) {
      expect(shell.props[slot]).toBeTruthy();
    }
  });
});
