import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

const auth = vi.hoisted(() => ({
  status: 'authenticated' as 'anonymous' | 'authenticated' | 'loading',
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => ({ status: auth.status }) }));

import { SignedInMenuLinks } from './signed-in-menu-links';

describe('SignedInMenuLinks', () => {
  beforeEach(() => {
    auth.status = 'authenticated';
  });

  it('links a signed-in visitor to the account', () => {
    render(<SignedInMenuLinks />);
    expect(screen.getByRole('link', { name: messages.account.title })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it.each(['anonymous', 'loading'] as const)(
    'shows no account link while %s (Task 84)',
    (status) => {
      auth.status = status;
      const { container } = render(<SignedInMenuLinks />);
      expect(container).toBeEmptyDOMElement();
    },
  );
});
