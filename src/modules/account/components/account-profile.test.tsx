import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import type { AuthUser } from '@/modules/auth';
import { axe } from '@/test/axe';

import { AccountProfile } from './account-profile';
import { AccountShell } from './account-shell';

const user: AuthUser = {
  id: 1,
  fullName: 'Reader',
  email: 'reader@example.com',
  phone: null,
  emailConfirmed: true,
  preferredLanguage: 'ar',
  roles: [],
  permissions: [],
  features: [],
};

describe('account overview', () => {
  it('shows the profile, live navigation, and inert deferred links', async () => {
    const { container } = render(
      <AccountShell>
        <AccountProfile user={user} />
      </AccountShell>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: messages.account.overview }),
    ).toBeInTheDocument();
    expect(screen.getByText(user.fullName)).toBeVisible();
    expect(screen.getByText(user.email)).toBeVisible();
    expect(screen.getByRole('link', { name: messages.account.addresses })).toHaveAttribute(
      'href',
      '/account/addresses',
    );
    expect(screen.getByRole('link', { name: messages.account.orders })).toHaveAttribute(
      'href',
      '/account/orders',
    );
    expect(container.querySelector('[data-feature="profile-edit"]')).toHaveAttribute('inert');
    expect(container.querySelector('[data-feature="wishlist-heart"]')).toHaveAttribute('inert');
    expect(await axe(container)).toHaveNoViolations();
  });
  it('shows the confirmation notice with inert resend for an unconfirmed address', () => {
    const { container } = render(<AccountProfile user={{ ...user, emailConfirmed: false }} />);
    expect(screen.getByText(messages.account.unconfirmed)).toBeVisible();
    expect(container.querySelector('[data-feature="resend-confirmation"]')).toHaveAttribute(
      'inert',
    );
  });
});
