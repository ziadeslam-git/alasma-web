import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';

import { ForgotPasswordForm } from './forgot-password-form';

const text = messages.auth;
const user = userEvent.setup({ delay: null });
const url = `${globalThis.location.origin}/api/v1/auth/forgot-password`;
const email = () => screen.getByLabelText(new RegExp(text.email));
const submit = () => screen.getByRole('button', { name: text.sendResetLink });

describe('ForgotPasswordForm', () => {
  it('validates the email and focuses it', async () => {
    render(<ForgotPasswordForm />);
    await user.click(submit());
    expect(screen.getByText(text.required)).toBeInTheDocument();
    expect(email()).toHaveFocus();

    await user.type(email(), 'not-an-email');
    await user.click(submit());
    expect(screen.getByText(text.invalidEmail)).toBeInTheDocument();
  });

  it.each(['known@example.com', 'unknown@example.com'])(
    'shows the same neutral success for %s (202)',
    async (address) => {
      let body: unknown;
      server.use(
        http.post(url, async ({ request }) => {
          body = await request.json();

          return new HttpResponse(null, { status: 202 });
        }),
      );
      render(<ForgotPasswordForm />);
      await user.type(email(), address);
      await user.click(submit());

      expect(await screen.findByText(text.forgotSuccessDescription)).toBeInTheDocument();
      expect(body).toEqual({ email: address });
      expect(screen.getByRole('link', { name: text.backToLogin })).toHaveAttribute(
        'href',
        '/login',
      );
      expect(globalThis.location.search).toBe('');
    },
  );

  it('shows the rate-limit message and disables the button for Retry-After', async () => {
    server.use(
      http.post(url, () =>
        HttpResponse.json(
          { status: 429, title: 'Too many requests' },
          {
            headers: { 'Retry-After': '30', 'Content-Type': 'application/problem+json' },
            status: 429,
          },
        ),
      ),
    );
    render(<ForgotPasswordForm />);
    await user.type(email(), 'reader@example.com');
    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.status['429']);
    expect(screen.getByText(text.retryAfter.replace('{seconds}', '30'))).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it('shows the network message on a network failure', async () => {
    server.use(http.post(url, () => HttpResponse.error()));
    render(<ForgotPasswordForm />);
    await user.type(email(), 'reader@example.com');
    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(messages.apiErrors.kind.network);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ForgotPasswordForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
