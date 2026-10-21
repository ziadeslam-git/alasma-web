import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';

import { ConfirmEmailView } from './confirm-email-page';

const text = messages.auth;
const user = userEvent.setup({ delay: null });
const url = `${globalThis.location.origin}/api/v1/auth/confirm-email`;
const auth = vi.hoisted(() => ({
  ensureFreshSession: vi.fn(),
  status: 'anonymous',
}));

vi.mock('@/modules/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/auth')>()),
  ensureFreshSession: auth.ensureFreshSession,
  useAuth: () => ({ login: vi.fn(), logout: vi.fn(), status: auth.status, user: null }),
}));

function mockConfirm(responder: () => Response) {
  const calls: unknown[] = [];
  server.use(
    http.post(url, async ({ request }) => {
      calls.push(await request.json());

      return responder();
    }),
  );

  return calls;
}

const problem = () =>
  HttpResponse.json(
    { code: 'auth_invalid_token', status: 400, title: 'x' },
    { headers: { 'Content-Type': 'application/problem+json' }, status: 400 },
  );

beforeEach(() => {
  auth.status = 'anonymous';
  auth.ensureFreshSession.mockReset().mockResolvedValue('token');
  globalThis.history.replaceState(null, '', '/confirm-email?userId=7&token=fake-token');
});

describe('ConfirmEmailView', () => {
  it('calls the API exactly once under StrictMode and cleans the URL', async () => {
    const calls = mockConfirm(() => new HttpResponse(null, { status: 204 }));
    render(
      <StrictMode>
        <ConfirmEmailView />
      </StrictMode>,
    );

    expect(await screen.findByText(text.confirmSuccessTitle)).toBeInTheDocument();
    expect(calls).toEqual([{ token: 'fake-token', userId: 7 }]);
    expect(globalThis.location.search).toBe('');
    expect(screen.getByRole('link', { name: text.login })).toHaveAttribute('href', '/login');
    expect(auth.ensureFreshSession).not.toHaveBeenCalled();
  });

  it('forces a session refresh and offers the store when authenticated', async () => {
    auth.status = 'authenticated';
    mockConfirm(() => new HttpResponse(null, { status: 204 }));
    render(<ConfirmEmailView />);

    expect(await screen.findByRole('link', { name: text.continueToStore })).toHaveAttribute(
      'href',
      '/books',
    );
    await waitFor(() => expect(auth.ensureFreshSession).toHaveBeenCalledTimes(1));
    expect(auth.ensureFreshSession).toHaveBeenCalledWith({ force: true });
  });

  it('shows the invalid link state with an inert Soon resend control, and never retries', async () => {
    const calls = mockConfirm(problem);
    const { container } = render(<ConfirmEmailView />);

    expect(await screen.findByText(text.confirmInvalidTitle)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: text.retry })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.resendConfirmation })).toBeDisabled();
    const gate = container.querySelector('[data-feature="resend-confirmation"]');
    expect(gate).toHaveAttribute('inert');
    expect(gate).toHaveTextContent(text.soonBadge);
    expect(calls).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the invalid state without calling the API when the token is missing', async () => {
    globalThis.history.replaceState(null, '', '/confirm-email');
    const calls = mockConfirm(() => new HttpResponse(null, { status: 204 }));
    render(<ConfirmEmailView />);

    expect(await screen.findByText(text.confirmInvalidTitle)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('offers a retry after a network failure and succeeds on the second call', async () => {
    let attempt = 0;
    const calls: unknown[] = [];
    server.use(
      http.post(url, async ({ request }) => {
        calls.push(await request.json());
        attempt += 1;

        return attempt === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
      }),
    );
    render(<ConfirmEmailView />);

    await user.click(await screen.findByRole('button', { name: text.retry }));
    expect(await screen.findByText(text.confirmSuccessTitle)).toBeInTheDocument();
    expect(calls).toHaveLength(2);
  });
});
