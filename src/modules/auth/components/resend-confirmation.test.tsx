import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';

import { ResendConfirmation } from './resend-confirmation';

const url = `${globalThis.location.origin}/api/v1/auth/resend-confirmation`;
const button = () => screen.getByRole('button', { name: messages.account.resend });

describe('ResendConfirmation', () => {
  afterEach(() => vi.useRealTimers());

  it('sends to the given address, then stays disabled for the cooldown', async () => {
    let body: unknown;
    server.use(
      http.post(url, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 202 });
      }),
    );
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ResendConfirmation email="reader@example.com" />);
    fireEvent.click(button());

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(messages.account.resendSent),
    );
    expect(body).toEqual({ email: 'reader@example.com' });
    expect(button()).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('60');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(button()).toBeEnabled();
  });

  it('shows the API error and uses Retry-After as the cooldown on a 429', async () => {
    server.use(
      http.post(url, () =>
        HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '30' } }),
      ),
    );
    render(<ResendConfirmation email="reader@example.com" />);
    fireEvent.click(button());

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.status['429']);
    expect(button()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('30');
  });

  it('shows an error and lets the user try again after another failure', async () => {
    server.use(http.post(url, () => HttpResponse.json({}, { status: 400 })));
    render(<ResendConfirmation email="reader@example.com" />);
    fireEvent.click(button());

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.status['400']);
    expect(button()).toBeEnabled();
  });
});
