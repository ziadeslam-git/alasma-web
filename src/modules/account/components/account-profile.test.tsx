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
  it('shows the profile and live navigation, and leaves the soon entries out (Task 73)', async () => {
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
    expect(container.querySelector('[data-feature="profile-edit"]')).toBeNull();
    expect(container.querySelector('[data-feature="wishlist-heart"]')).toBeNull();
    expect(screen.queryByText(messages.account.wishlist)).toBeNull();
    expect(screen.queryByText(messages.account.editProfile)).toBeNull();
    expect(screen.queryByText(messages.site.soon)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
  it('shows the confirmation notice without the resend link for an unconfirmed address', () => {
    const { container } = render(<AccountProfile user={{ ...user, emailConfirmed: false }} />);
    expect(screen.getByText(messages.account.unconfirmed)).toBeVisible();
    // Task 76: the resend link is hidden (not dimmed) until its feature is live; the banner text stays
    expect(container.querySelector('[data-feature="resend-confirmation"]')).toBeNull();
    expect(screen.queryByText(messages.account.resend)).toBeNull();
  });

  it('renders every row as one label with its value, and no orphan label (Task 73)', () => {
    const { container } = render(<AccountProfile user={{ ...user, phone: '01000000000' }} />);
    const rows = Array.from(container.querySelectorAll('dl > div'));
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.querySelectorAll('dt')).toHaveLength(1);
      expect(row.querySelectorAll('dd')).toHaveLength(1);
      expect(row.querySelector('dd')?.textContent?.trim()).not.toBe('');
    }
    // the email status is a badge inside the email value, never a row or paragraph of its own
    const emailRow = rows.find(
      (row) => row.querySelector('dt')?.textContent === messages.account.email,
    );
    expect(emailRow?.querySelector('dd')).toHaveTextContent(messages.account.confirmedBadge);
    expect(screen.queryByText(messages.account.confirmed)).toBeNull();
    expect(screen.getByText(user.email).closest('bdi')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('01000000000').closest('bdi')).toHaveAttribute('dir', 'ltr');
    // no value element carries dir=ltr itself (that aligned it to the physical left)
    for (const dd of container.querySelectorAll('dd')) expect(dd).not.toHaveAttribute('dir');
  });

  it('shows no confirmed badge when the email is not confirmed, and the no-phone text', () => {
    render(<AccountProfile user={{ ...user, emailConfirmed: false }} />);
    expect(screen.queryByText(messages.account.confirmedBadge)).toBeNull();
    expect(screen.getByText(messages.account.noPhone)).toBeVisible();
  });
});
