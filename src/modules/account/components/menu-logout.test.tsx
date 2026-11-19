import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

const auth = vi.hoisted(() => ({
  status: 'authenticated' as 'anonymous' | 'authenticated' | 'loading',
  logout: vi.fn(),
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => auth }));

import { MenuLogout } from './menu-logout';

describe('MenuLogout', () => {
  beforeEach(() => {
    auth.status = 'authenticated';
    auth.logout.mockReset();
  });

  it('calls the shared logout handler for a signed-in visitor (Task 84)', async () => {
    render(<MenuLogout />);
    await userEvent.setup().click(screen.getByRole('button', { name: messages.account.logout }));
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it.each(['anonymous', 'loading'] as const)('renders nothing while %s', (status) => {
    auth.status = status;
    const { container } = render(<MenuLogout />);
    expect(container).toBeEmptyDOMElement();
  });
});
