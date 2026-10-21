import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';

import { ResetPasswordForm } from './reset-password-form';

const text = messages.auth;
const user = userEvent.setup({ delay: null });
const url = `${globalThis.location.origin}/api/v1/auth/reset-password`;
const strong = 'Abcdefgh1x';
const field = (name: string) => document.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
const submit = () => screen.getByRole('button', { name: text.resetPasswordButton });

async function fill(password = strong, confirm = password) {
  await user.type(field('password'), password);
  await user.type(field('confirmPassword'), confirm);
}

function problem(status: number, extra: Record<string, unknown>) {
  return HttpResponse.json(
    { status, title: 'x', ...extra },
    { headers: { 'Content-Type': 'application/problem+json' }, status },
  );
}

beforeEach(() => {
  globalThis.history.replaceState(null, '', '/reset-password?userId=5&token=fake-token');
});

describe('ResetPasswordForm', () => {
  it('removes the token from the URL after mount', async () => {
    render(<ResetPasswordForm />);
    await screen.findByRole('heading', { level: 1, name: text.resetTitle });
    expect(globalThis.location.search).toBe('');
    expect(field('password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('shows an error state with no form when the token is missing', async () => {
    globalThis.history.replaceState(null, '', '/reset-password?userId=5');
    render(<ResetPasswordForm />);
    expect(await screen.findByText(text.resetMissingTitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.requestNewLink })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(document.querySelector('form')).toBeNull();
  });

  it('validates the password rules and the confirmation, and focuses the first invalid field', async () => {
    render(<ResetPasswordForm />);
    await screen.findByRole('heading', { level: 1 });
    await user.click(submit());
    expect(screen.getAllByText(text.required).length).toBeGreaterThan(0);
    expect(field('password')).toHaveFocus();

    await fill(strong, 'Different1xx');
    await user.click(submit());
    expect(screen.getByText(text.passwordMismatch)).toBeInTheDocument();
  });

  it('sends userId, token and newPassword only, then shows success with a login link', async () => {
    let body: unknown;
    server.use(
      http.post(url, async ({ request }) => {
        body = await request.json();

        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(<ResetPasswordForm />);
    await screen.findByRole('heading', { level: 1 });
    await fill();
    await user.click(submit());

    expect(await screen.findByText(text.resetSuccessTitle)).toBeInTheDocument();
    expect(body).toEqual({ newPassword: strong, token: 'fake-token', userId: 5 });
    expect(screen.getByRole('link', { name: text.login })).toHaveAttribute('href', '/login');
  });

  it('maps a 400 invalid token to the Arabic message with a link to request a new one', async () => {
    server.use(http.post(url, () => problem(400, { code: 'auth_invalid_token' })));
    render(<ResetPasswordForm />);
    await screen.findByRole('heading', { level: 1 });
    await fill();
    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.auth_invalid_token,
    );
    expect(screen.getByRole('link', { name: text.requestNewLink })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('shows a field error under the new password', async () => {
    server.use(
      http.post(url, () =>
        problem(400, { code: 'auth_password_invalid', errors: { NewPassword: ['Too weak.'] } }),
      ),
    );
    render(<ResetPasswordForm />);
    await screen.findByRole('heading', { level: 1 });
    await fill();
    await user.click(submit());

    await waitFor(() => expect(screen.getByText('Too weak.')).toBeInTheDocument());
    expect(field('password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ResetPasswordForm />);
    await screen.findByRole('heading', { level: 1 });
    expect(await axe(container)).toHaveNoViolations();
  });
});
