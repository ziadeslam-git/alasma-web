import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { notifyForbidden } from '@/modules/auth';

import { useForbiddenHandler } from './use-forbidden-handler';

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  setUser: vi.fn(),
  show: vi.fn(),
}));

vi.mock('@/modules/auth', async () => {
  const actual = await vi.importActual<typeof import('@/modules/auth')>('@/modules/auth');

  return {
    ...actual,
    getAuthApi: () => ({ me: mocks.me }),
    useAuth: () => ({ setUser: mocks.setUser }),
  };
});
vi.mock('@/shared/ui/toast', () => ({ useToast: () => ({ show: mocks.show }) }));

function Probe() {
  useForbiddenHandler();

  return null;
}

describe('useForbiddenHandler', () => {
  it('shows the toast and loads /me again after a 403', async () => {
    const fresh = { fullName: 'Fresh', permissions: [], roles: ['Admin'] };
    mocks.me.mockResolvedValue(fresh);
    render(<Probe />);

    notifyForbidden();

    expect(mocks.show).toHaveBeenCalledWith(messages.admin.forbiddenToast, {
      closeLabel: messages.admin.toastClose,
      kind: 'error',
    });
    await waitFor(() => expect(mocks.setUser).toHaveBeenCalledWith(fresh));
    expect(mocks.me).toHaveBeenCalledTimes(1);
  });

  it('stops listening when the admin area unmounts', () => {
    mocks.show.mockClear();
    render(<Probe />).unmount();

    notifyForbidden();

    expect(mocks.show).not.toHaveBeenCalled();
  });
});
