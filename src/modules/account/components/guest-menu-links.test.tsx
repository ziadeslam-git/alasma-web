import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

const auth = vi.hoisted(() => ({
  status: 'anonymous' as 'anonymous' | 'authenticated' | 'loading',
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => ({ status: auth.status }) }));

import { GuestMenuLinks } from './guest-menu-links';

describe('GuestMenuLinks', () => {
  beforeEach(() => {
    auth.status = 'anonymous';
  });

  it('offers login and register to a signed-out visitor', () => {
    render(<GuestMenuLinks />);
    expect(screen.getByRole('link', { name: messages.site.header.login })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: messages.site.header.register })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it.each(['authenticated', 'loading'] as const)('renders nothing while %s', (status) => {
    auth.status = status;
    const { container } = render(<GuestMenuLinks />);
    expect(container).toBeEmptyDOMElement();
  });
});
