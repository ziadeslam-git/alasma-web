import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { server } from '@/mocks/server';
import messages from '@/i18n/messages/ar.json';

import { RegisterForm } from './register-form';

const text = messages.auth;
const registerUrl = `${globalThis.location.origin}/api/v1/auth/register`;
const password = 'Abcdefgh1x';

const label = (name: string) => screen.getByLabelText(new RegExp(name));
const submit = () => screen.getByRole('button', { name: text.register });

async function fillValid(overrides: Partial<Record<string, string>> = {}) {
  await userEvent.type(label(text.fullName), overrides.fullName ?? 'Test Reader');
  await userEvent.type(label(text.email), overrides.email ?? 'reader@example.com');
  await userEvent.type(label(text.phone), overrides.phone ?? '01012345678');
  await userEvent.type(
    document.querySelector('[name="password"]')!,
    overrides.password ?? password,
  );
  await userEvent.type(
    document.querySelector('[name="confirmPassword"]')!,
    overrides.confirm ?? overrides.password ?? password,
  );
  await userEvent.click(screen.getByRole('checkbox'));
}

function captureBody() {
  const sent: { body?: unknown; calls: number } = { calls: 0 };
  server.use(
    http.post(registerUrl, async ({ request }) => {
      sent.calls += 1;
      sent.body = await request.json();

      return HttpResponse.json(
        { email: 'reader@example.com', emailConfirmed: false, userId: 9 },
        { status: 201 },
      );
    }),
  );

  return sent;
}

describe('RegisterForm', () => {
  it('shows every required message after the first submit and focuses the first field', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await userEvent.click(submit());

    expect(screen.getAllByText(text.required).length).toBeGreaterThanOrEqual(4);
    expect(label(text.fullName)).toHaveFocus();
    expect(sent.calls).toBe(0);
  });

  it('applies the real password rules', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await fillValid({ password: 'alllowercase1' });
    await userEvent.click(submit());

    expect(screen.getByText(text.passwordNeedsUpper)).toBeInTheDocument();
    expect(sent.calls).toBe(0);
  });

  it('shows the password rule hint', () => {
    render(<RegisterForm />);

    expect(screen.getByText(text.passwordHint)).toBeInTheDocument();
  });

  it('rejects a confirmation that does not match', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await fillValid({ confirm: 'Different1234' });
    await userEvent.click(submit());

    expect(screen.getByText(text.passwordMismatch)).toBeInTheDocument();
    expect(sent.calls).toBe(0);
  });

  it('shows the success state with a login link, and does not send the confirmation or the terms', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await fillValid();
    await userEvent.click(submit());

    expect(await screen.findByText(text.registerSuccessTitle)).toBeInTheDocument();
    expect(screen.getByText(text.registerSuccessDescription)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.login })).toHaveAttribute('href', '/login');
    expect(sent.body).toEqual({
      email: 'reader@example.com',
      fullName: 'Test Reader',
      password,
      phone: '01012345678',
    });
  });

  it('shows the Arabic message when the email is taken', async () => {
    server.use(
      http.post(registerUrl, () =>
        HttpResponse.json({ title: 'Conflict', code: 'auth_email_taken' }, { status: 409 }),
      ),
    );
    render(<RegisterForm />);

    await fillValid();
    await userEvent.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.auth_email_taken,
    );
    expect(screen.queryByText(text.registerSuccessTitle)).not.toBeInTheDocument();
  });

  it('maps a validation problem to the matching fields', async () => {
    server.use(
      http.post(registerUrl, () =>
        HttpResponse.json(
          { title: 'Bad Request', errors: { Email: ['Email problem'], phone: ['Phone problem'] } },
          { status: 400 },
        ),
      ),
    );
    render(<RegisterForm />);

    await fillValid();
    await userEvent.click(submit());

    expect(await screen.findByText('Email problem')).toBeInTheDocument();
    expect(screen.getByText('Phone problem')).toBeInTheDocument();
    expect(label(text.email)).toHaveAttribute('aria-invalid', 'true');
    expect(label(text.phone)).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets the right autocomplete attributes', () => {
    render(<RegisterForm />);

    expect(label(text.email)).toHaveAttribute('autocomplete', 'email');
    expect(document.querySelector('[name="password"]')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(document.querySelector('[name="confirmPassword"]')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RegisterForm />);
    await userEvent.click(submit());

    expect(await axe(container)).toHaveNoViolations();
  });
});
