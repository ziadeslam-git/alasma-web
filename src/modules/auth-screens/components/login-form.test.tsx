import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { ToastProvider } from '@/shared/ui/toast';

import { LoginForm } from './login-form';

const text = messages.auth;
const nav = vi.hoisted(() => ({ replace: vi.fn(), search: '' }));
const auth = vi.hoisted(() => ({
  value: { login: vi.fn(), logout: vi.fn(), status: 'anonymous', user: null } as {
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    status: string;
    user: null;
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('@/modules/auth', () => ({ useAuth: () => auth.value }));

const confirmedUser = { emailConfirmed: true };

function mount() {
  return render(
    <ToastProvider label={text.toastLabel}>
      <LoginForm />
    </ToastProvider>,
  );
}

const email = () => screen.getByLabelText(new RegExp(text.email));
const password = () => screen.getByLabelText(new RegExp(text.password));
const submit = () => screen.getByRole('button', { name: text.login });

async function fillAndSubmit() {
  await userEvent.type(email(), 'reader@example.com');
  await userEvent.type(password(), 'a-fake-password');
  await userEvent.click(submit());
}

beforeEach(() => {
  nav.replace.mockReset();
  nav.search = '';
  auth.value = {
    login: vi.fn().mockResolvedValue(confirmedUser),
    logout: vi.fn(),
    status: 'anonymous',
    user: null,
  };
});

describe('LoginForm', () => {
  it('shows validation messages after the first submit and focuses the first invalid field', async () => {
    mount();
    expect(screen.queryByText(text.required)).not.toBeInTheDocument();

    await userEvent.click(submit());

    expect(screen.getAllByText(text.required)).toHaveLength(2);
    expect(email()).toHaveFocus();
    expect(auth.value.login).not.toHaveBeenCalled();

    await userEvent.type(email(), 'reader@example.com');
    await userEvent.click(submit());

    expect(password()).toHaveFocus();
  });

  it('rejects a malformed email', async () => {
    mount();
    await userEvent.type(email(), 'not-an-email');
    await userEvent.type(password(), 'x');
    await userEvent.click(submit());

    expect(screen.getByText(text.invalidEmail)).toBeInTheDocument();
    expect(auth.value.login).not.toHaveBeenCalled();
  });

  it('logs in and goes home', async () => {
    mount();

    await fillAndSubmit();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/'));
    expect(auth.value.login).toHaveBeenCalledWith({
      email: 'reader@example.com',
      password: 'a-fake-password',
    });
  });

  it('follows a safe next path', async () => {
    nav.search = 'next=/books?page=2';
    mount();

    await fillAndSubmit();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/books?page=2'));
  });

  it.each(['//evil.com', 'https://evil.com', String.raw`/\evil`, 'javascript:alert(1)'])(
    'ignores the unsafe next value %s',
    async (value) => {
      nav.search = `next=${encodeURIComponent(value)}`;
      mount();

      await fillAndSubmit();

      await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/'));
      expect(nav.replace).toHaveBeenCalledTimes(1);
    },
  );

  it('shows the Arabic message for an ApiError code in an alert and stays on the page', async () => {
    auth.value.login.mockRejectedValue(
      new ApiError({ code: 'auth_invalid_credentials', kind: 'problem', status: 401 }),
    );
    mount();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.apiErrors.codes.auth_invalid_credentials,
    );
    expect(nav.replace).not.toHaveBeenCalled();
    expect(submit()).toBeEnabled();
  });

  it('disables the form and shows the loading state while submitting', async () => {
    let finish: (value: unknown) => void = () => undefined;
    auth.value.login.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    mount();

    await fillAndSubmit();

    expect(submit()).toBeDisabled();
    expect(submit()).toHaveAttribute('aria-busy', 'true');
    expect(email()).toBeDisabled();
    expect(password()).toBeDisabled();

    finish(confirmedUser);
    await waitFor(() => expect(nav.replace).toHaveBeenCalled());
  });

  it('tells a user with an unconfirmed email to confirm it, then continues', async () => {
    auth.value.login.mockResolvedValue({ emailConfirmed: false });
    mount();

    await fillAndSubmit();

    expect(await screen.findByText(text.unconfirmedToast)).toBeInTheDocument();
    expect(nav.replace).toHaveBeenCalledWith('/');
  });

  it('does not show the confirmation toast for a confirmed email', async () => {
    mount();

    await fillAndSubmit();

    await waitFor(() => expect(nav.replace).toHaveBeenCalled());
    expect(screen.queryByText(text.unconfirmedToast)).not.toBeInTheDocument();
  });

  it('redirects a visitor who is already signed in and never shows the form', () => {
    auth.value.status = 'authenticated';
    nav.search = 'next=/books';

    mount();

    expect(nav.replace).toHaveBeenCalledWith('/books');
    expect(screen.queryByLabelText(new RegExp(text.email))).not.toBeInTheDocument();
  });

  it('renders a disabled form while the session is loading and does not redirect or submit', async () => {
    auth.value.status = 'loading';
    mount();

    expect(email()).toBeDisabled();
    expect(password()).toBeDisabled();
    expect(submit()).toBeDisabled();
    await userEvent.click(submit());

    expect(auth.value.login).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('has no staff login link', () => {
    mount();

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/forgot-password',
      '/register',
    ]);
  });

  it('sets the right autocomplete attributes', () => {
    mount();

    expect(email()).toHaveAttribute('autocomplete', 'username');
    expect(password()).toHaveAttribute('autocomplete', 'current-password');
    expect(password()).toHaveAttribute('type', 'password');
  });

  it('has no accessibility violations', async () => {
    const { container } = mount();
    await userEvent.click(submit());

    expect(await axe(container)).toHaveNoViolations();
  });
});
