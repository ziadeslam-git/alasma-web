import { fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';

import { ResendByEmail } from './resend-by-email';

const url = `${globalThis.location.origin}/api/v1/auth/resend-confirmation`;
const button = () => screen.getByRole('button', { name: messages.auth.resendConfirmation });

describe('ResendByEmail', () => {
  it('asks for a valid address before sending', () => {
    render(<ResendByEmail />);
    fireEvent.click(button());

    expect(screen.getByLabelText(new RegExp(messages.auth.email))).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('sends the typed address and shows the neutral success text', async () => {
    let body: unknown;
    server.use(
      http.post(url, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 202 });
      }),
    );
    render(<ResendByEmail />);
    fireEvent.change(screen.getByLabelText(new RegExp(messages.auth.email)), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(button());

    expect(await screen.findByText(new RegExp(messages.auth.resendNeutral))).toBeVisible();
    expect(body).toEqual({ email: 'reader@example.com' });
  });
});
