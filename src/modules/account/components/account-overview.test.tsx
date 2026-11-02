import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

const mocks = vi.hoisted(() => ({ logout: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/modules/auth', () => ({
  useAuth: () => ({
    user: { fullName: 'Reader', email: 'reader@example.com', phone: null, emailConfirmed: true },
    logout: mocks.logout,
  }),
}));

import { AccountOverview } from './account-overview';

it('signs out with the existing auth action', async () => {
  const user = userEvent.setup();
  render(<AccountOverview />);
  await user.click(screen.getByRole('button', { name: messages.account.logout }));
  expect(mocks.logout).toHaveBeenCalledOnce();
});
