import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import type { AuthUser } from '@/modules/auth';
import { AuthTestProvider } from '@/test/auth-test-provider';
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

// The email is split by <wbr> into several text nodes, so it is found by the text of its <bdi>.
function emailBdi(container: HTMLElement, email = user.email) {
  const found = Array.from(container.querySelectorAll('bdi')).find(
    (bdi) => bdi.textContent === email,
  );
  if (!found) throw new Error(`no <bdi> holds ${email}`);
  return found;
}

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
    expect(emailBdi(container)).toBeVisible();
    expect(screen.getByRole('link', { name: messages.account.addresses })).toHaveAttribute(
      'href',
      '/account/addresses',
    );
    expect(screen.getByRole('link', { name: messages.account.orders })).toHaveAttribute(
      'href',
      '/account/orders',
    );
    expect(screen.getByRole('link', { name: messages.account.editProfile })).toHaveAttribute(
      'href',
      '/account/profile',
    );
    expect(screen.getByRole('link', { name: messages.account.wishlist })).toHaveAttribute(
      'href',
      '/account/wishlist',
    );
    // Only the two design entries without an API (notifications and the reading goal) are dimmed with the soon label.
    expect(screen.getAllByText(messages.site.soon)).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });
  it('shows the confirmation notice with a working resend action for an unconfirmed address', () => {
    render(
      <AuthTestProvider>
        <AccountProfile user={{ ...user, emailConfirmed: false }} />
      </AuthTestProvider>,
    );
    expect(screen.getByText(messages.account.unconfirmed)).toBeVisible();
    expect(screen.getByRole('button', { name: messages.account.resend })).toBeEnabled();
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
    expect(emailBdi(container)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('01000000000').closest('bdi')).toHaveAttribute('dir', 'ltr');
    // no value element carries dir=ltr itself (that aligned it to the physical left)
    for (const dd of container.querySelectorAll('dd')) expect(dd).not.toHaveAttribute('dir');
  });

  it('lets the email wrap only after "@" and ".", never inside a part, and keeps the whole address (Task 84)', () => {
    const { container } = render(
      <AccountProfile user={{ ...user, email: 'e2e-walk-confirmed@mail.example.com' }} />,
    );
    const bdi = emailBdi(container, 'e2e-walk-confirmed@mail.example.com');

    expect(bdi).toHaveAttribute('dir', 'ltr');
    expect(bdi.textContent).toBe('e2e-walk-confirmed@mail.example.com');
    // a break opportunity after "@" and after each "." and nowhere else
    expect(bdi.querySelectorAll('wbr')).toHaveLength(3);
    expect(Array.from(bdi.childNodes).map((node) => node.nodeName)).toEqual([
      '#text',
      'WBR',
      '#text',
      'WBR',
      '#text',
      'WBR',
      '#text',
    ]);
  });

  it('shows no confirmed badge when the email is not confirmed, and the no-phone text', () => {
    render(
      <AuthTestProvider>
        <AccountProfile user={{ ...user, emailConfirmed: false }} />
      </AuthTestProvider>,
    );
    expect(screen.queryByText(messages.account.confirmedBadge)).toBeNull();
    expect(screen.getByText(messages.account.noPhone)).toBeVisible();
  });
});
