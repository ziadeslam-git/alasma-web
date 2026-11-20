import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { axe } from '@/test/axe';

import { server } from '@/mocks/server';
import messages from '@/i18n/messages/ar.json';

import { RegisterForm } from './register-form';

const text = messages.auth;
const user = userEvent.setup({ delay: null });
const registerUrl = `${globalThis.location.origin}/api/v1/auth/register`;
const password = 'Abcdefgh1x';

const label = (name: string) => screen.getByLabelText(new RegExp(name));
const submit = () => screen.getByRole('button', { name: text.register });

// Fields that are not the subject of a test are pasted (one event); only the password is typed key by key when a
// test passes its own password, because that test is about the rules.
async function enter(element: HTMLElement, value: string, isTyped = false) {
  if (isTyped) {
    await user.type(element, value);

    return;
  }

  await user.click(element);
  await user.paste(value);
}

async function fillValid(overrides: Partial<Record<string, string>> = {}) {
  await enter(label(text.fullName), overrides.fullName ?? 'Test Reader');
  await enter(label(text.email), overrides.email ?? 'reader@example.com');
  await enter(label(text.phone), overrides.phone ?? '01012345678');
  await enter(
    document.querySelector<HTMLElement>('[name="password"]')!,
    overrides.password ?? password,
    overrides.password !== undefined,
  );
  await enter(
    document.querySelector<HTMLElement>('[name="confirmPassword"]')!,
    overrides.confirm ?? overrides.password ?? password,
  );
  await user.click(screen.getByRole('checkbox'));
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

    await user.click(submit());

    expect(screen.getAllByText(text.required).length).toBeGreaterThanOrEqual(4);
    expect(label(text.fullName)).toHaveFocus();
    expect(sent.calls).toBe(0);
  });

  it('applies the real password rules', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await fillValid({ password: 'alllowercase1' });
    await user.click(submit());

    expect(screen.getByText(text.passwordNeedsUpper)).toBeInTheDocument();
    expect(sent.calls).toBe(0);
  });

  it('shows the live password checklist (it replaced the static hint) and updates it while typing', async () => {
    render(<RegisterForm />);

    const met = (rule: string) =>
      screen.getByText(rule).closest('li')?.getAttribute('data-met') === 'true';

    expect(screen.getByText(text.passwordRulesTitle)).toBeInTheDocument();
    expect(met(text.passwordRuleLength)).toBe(false);

    await user.type(document.querySelector<HTMLElement>('[name="password"]')!, 'Abcdefgh1');

    expect(met(text.passwordRuleUpper)).toBe(true);
    expect(met(text.passwordRuleLower)).toBe(true);
    expect(met(text.passwordRuleDigit)).toBe(true);
    expect(met(text.passwordRuleLength)).toBe(false);
    expect(screen.queryByText(/10 أحرف على الأقل، وتحتوي/)).not.toBeInTheDocument();
  });

  it('has a show/hide button on the password and the confirmation, and none that submits', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    const toggles = screen.getAllByRole('button', { name: text.showPassword });

    expect(toggles).toHaveLength(2);

    await user.click(toggles[0]!);

    expect(document.querySelector('[name="password"]')).toHaveAttribute('type', 'text');
    expect(document.querySelector('[name="confirmPassword"]')).toHaveAttribute('type', 'password');
    expect(sent.calls).toBe(0);
  });

  it('rejects a confirmation that does not match', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await fillValid({ confirm: 'Different1234' });
    await user.click(submit());

    expect(screen.getByText(text.passwordMismatch)).toBeInTheDocument();
    expect(sent.calls).toBe(0);
  });

  it('shows the success state with a login link, and does not send the confirmation or the terms', async () => {
    const sent = captureBody();
    render(<RegisterForm />);

    await fillValid();
    await user.click(submit());

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

  it('leaves the soon resend control out of the success state (Task 78)', async () => {
    captureBody();
    const { container } = render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'resend-confirmation': 'soon' }}>
        <RegisterForm />
      </FeatureFlagsProvider>,
    );

    await fillValid();
    await user.click(submit());

    expect(await screen.findByText(text.registerSuccessTitle)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: text.resendConfirmation })).toBeNull();
    expect(container.querySelector('[data-feature="resend-confirmation"]')).toBeNull();
  });

  it('shows the resend control on the success state once its feature is live', async () => {
    captureBody();
    render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'resend-confirmation': 'live' }}>
        <RegisterForm />
      </FeatureFlagsProvider>,
    );

    await fillValid();
    await user.click(submit());

    expect(await screen.findByText(text.registerSuccessTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.resendConfirmation })).toBeInTheDocument();
  });

  it('shows the Arabic message when the email is taken', async () => {
    server.use(
      http.post(registerUrl, () =>
        HttpResponse.json({ title: 'Conflict', code: 'auth_email_taken' }, { status: 409 }),
      ),
    );
    render(<RegisterForm />);

    await fillValid();
    await user.click(submit());

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
    await user.click(submit());

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
    await user.click(submit());

    expect(await axe(container)).toHaveNoViolations();
  });
});
