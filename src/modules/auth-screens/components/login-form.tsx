'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/toast';

import { focusFirstInvalid, mapFieldErrors } from '../field-errors';
import { isSafeRedirectPath, validateLogin } from '../validation';
import { placeholders } from '../placeholders';
import styles from './form.module.css';
import { PasswordInput } from './password-input';

const fieldOrder = ['email', 'password'] as const;

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { show } = useToast();
  const text = messages.auth;
  const formRef = useRef<HTMLFormElement>(null);
  const hasLeft = useRef(false);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only a same-site path is followed; anything else goes home.
  const next = params.get('next');
  const target = isSafeRedirectPath(next) ? next : routes.home;

  // A visitor who is already signed in has nothing to do here.
  useEffect(() => {
    if (status === 'authenticated' && !hasLeft.current) {
      hasLeft.current = true;
      router.replace(target);
    }
  }, [router, status, target]);

  const submit = async () => {
    if (isSubmitting || status !== 'anonymous') {
      return;
    }

    const found = validateLogin(values, text);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    setAlert('');
    setIsSubmitting(true);

    try {
      const user = await login({ email: values.email.trim(), password: values.password });

      if (!user.emailConfirmed) {
        show(text.unconfirmedToast, { closeLabel: text.toastClose, kind: 'warning' });
      }

      hasLeft.current = true;
      router.replace(target);
    } catch (error) {
      if (error instanceof ApiError) {
        setAlert(getApiErrorMessage(error));
        setErrors(mapFieldErrors(error, fieldOrder));
      } else {
        setAlert(messages.apiErrors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Signed in already: the redirect is running, so nothing is rendered. A skeleton here flashed bars inside the card
  // before the page changed (Task 84); AuthCard hides itself while it is empty (:empty), so no blank card is left either.
  if (status === 'authenticated') return null;

  const isDisabled = status === 'loading' || isSubmitting;

  return (
    <form
      aria-busy={status === 'loading' || undefined}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      ref={formRef}
    >
      <h1>{text.loginTitle}</h1>
      <p>{text.loginDescription}</p>
      {alert ? <p role="alert">{alert}</p> : null}
      <Field error={errors.email} label={text.email} required>
        <Input
          autoComplete="username"
          dir="ltr"
          disabled={isDisabled}
          name="email"
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          placeholder={placeholders.email}
          type="email"
          value={values.email}
        />
      </Field>
      <Field error={errors.password} label={text.password} required>
        <PasswordInput
          autoComplete="current-password"
          disabled={isDisabled}
          name="password"
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          value={values.password}
        />
      </Field>
      <div className={styles.row}>
        <Link className={styles.link} href={routes.forgotPassword}>
          {text.forgotPassword}
        </Link>
      </div>
      <Button
        disabled={status === 'loading'}
        fullWidth
        loading={isSubmitting}
        onClick={() => void submit()}
        size="lg"
      >
        {text.login}
      </Button>
      <div className={styles.note}>
        <Icon name="shield" size="sm" />
        <span>{text.loginNote}</span>
      </div>
      <p className={styles.switch}>
        {text.noAccount}{' '}
        <Link className={styles.link} href={routes.register}>
          {text.registerLink}
        </Link>
      </p>
    </form>
  );
}
