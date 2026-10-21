'use client';

import { useEffect, useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { getApiClient } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { focusFirstInvalid } from '../field-errors';
import { validateForgotPassword } from '../validation';
import { AuthMessage } from './auth-message';
import styles from './form.module.css';

const fieldOrder = ['email'] as const;

export function ForgotPasswordForm() {
  const text = messages.auth;
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 429: the button stays disabled until Retry-After has passed. The text shows the seconds once (no ticking).
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const submit = async () => {
    if (isSubmitting || waitSeconds > 0) {
      return;
    }

    const found = validateForgotPassword({ email }, text);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    setAlert('');
    setIsSubmitting(true);

    try {
      // The API answers 202 whatever the address, so the success state below never tells whether it exists.
      await getApiClient().POST('/api/v1/auth/forgot-password', { body: { email: email.trim() } });
      setIsDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setAlert(getApiErrorMessage(error));

        if (error.status === 429 && error.retryAfterSeconds && error.retryAfterSeconds > 0) {
          const seconds = Math.ceil(error.retryAfterSeconds);
          setWaitSeconds(seconds);
          timer.current = setTimeout(() => setWaitSeconds(0), seconds * 1000);
        }
      } else {
        setAlert(messages.apiErrors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <AuthMessage description={text.forgotSuccessDescription} title={text.forgotSuccessTitle}>
        <ButtonLink href={routes.login}>{text.backToLogin}</ButtonLink>
      </AuthMessage>
    );
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      ref={formRef}
    >
      <h1>{text.forgotTitle}</h1>
      <p>{text.forgotDescription}</p>
      {alert ? <p role="alert">{alert}</p> : null}
      {waitSeconds > 0 ? <p>{text.retryAfter.replace('{seconds}', String(waitSeconds))}</p> : null}
      <Field error={errors.email} label={text.email} required>
        <Input
          autoComplete="email"
          disabled={isSubmitting}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </Field>
      <Button
        disabled={waitSeconds > 0}
        fullWidth
        loading={isSubmitting}
        onClick={() => void submit()}
      >
        {text.sendResetLink}
      </Button>
      <ButtonLink href={routes.login} variant="ghost">
        {text.backToLogin}
      </ButtonLink>
    </form>
  );
}
