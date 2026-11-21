import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { axe } from '@/test/axe';

import { NewsletterForm } from './newsletter-form';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => null }, { baseUrl: 'http://localhost' }),
  };
});

const text = messages.newsletter;
const url = 'http://localhost/api/v1/newsletter/subscribe';

const problem = (status: number) =>
  HttpResponse.json(
    { status, title: 'x' },
    { headers: { 'Content-Type': 'application/problem+json' }, status },
  );

async function type(value: string) {
  await userEvent.type(screen.getByLabelText(text.emailLabel), value);
}

describe('NewsletterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has no axe violations', async () => {
    const { container } = render(<NewsletterForm />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('rejects an invalid address on the client and sends nothing', async () => {
    let calls = 0;
    server.use(
      http.post(url, () => {
        calls += 1;
        return HttpResponse.json({ status: 'accepted' }, { status: 202 });
      }),
    );
    render(<NewsletterForm />);
    await type('not-an-email');

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    expect(await screen.findByRole('alert')).toHaveTextContent(text.invalidEmail);
    expect(calls).toBe(0);
  });

  it('subscribes with the trimmed address (no Idempotency-Key) and shows the same neutral success', async () => {
    let body: unknown;
    let hasKey = true;
    server.use(
      http.post(url, async ({ request }) => {
        body = await request.json();
        hasKey = request.headers.has('Idempotency-Key');
        return HttpResponse.json({ status: 'accepted' }, { status: 202 });
      }),
    );
    render(<NewsletterForm />);
    await type('  reader@example.com ');

    await userEvent.click(screen.getByRole('button', { name: text.submit }));

    expect(await screen.findByRole('status')).toHaveTextContent(text.success);
    expect(body).toEqual({ email: 'reader@example.com' });
    expect(hasKey).toBe(false);
  });

  it('does not send twice while the request is running', async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post(url, async () => {
        calls += 1;
        await gate;
        return HttpResponse.json({ status: 'accepted' }, { status: 202 });
      }),
    );
    render(<NewsletterForm />);
    await type('reader@example.com');

    await userEvent.click(screen.getByRole('button', { name: text.submit }));
    await userEvent.click(await screen.findByRole('button', { name: text.submitting }));

    release();
    await screen.findByRole('status');
    expect(calls).toBe(1);
  });

  it('shows the Arabic message for 400 (malformed), 429 (rate limit) and 500', async () => {
    render(<NewsletterForm />);
    await type('reader@example.com');

    for (const [status, expected] of [
      [400, text.invalidEmail],
      [429, messages.apiErrors.status['429']],
      [500, messages.apiErrors.status['500']],
    ] as const) {
      server.use(http.post(url, () => problem(status)));
      await userEvent.click(screen.getByRole('button', { name: text.submit }));
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(expected));
    }
  });
});
