'use client';

import { useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { getApiClient } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';

import { focusFirstInvalid, mapFieldErrors } from '../field-errors';
import { useLinkParams } from '../use-link-params';
import { validateResetPassword } from '../validation';
import { AuthMessage } from './auth-message';
import styles from './form.module.css';

const fieldOrder = ['password', 'confirmPassword'] as const;
const invalidTokenCode = 'auth_invalid_token';

export function ResetPasswordForm() {
  const text = messages.auth;
  const link = useLinkParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ confirmPassword: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isNewLinkNeeded, setIsNewLinkNeeded] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting || !link?.token) {
      return;
    }

    const found = validateResetPassword(values, text);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    setAlert('');
    setIsNewLinkNeeded(false);
    setIsSubmitting(true);

    try {
      // confirmPassword is checked here only; the API does not take it. The user is not signed in afterwards.
      await getApiClient().POST('/api/v1/auth/reset-password', {
        body: { newPassword: values.password, token: link.token, userId: link.userId },
      });
      setIsDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = mapFieldErrors(error, ['newPassword', 'password']);
        const serverErrors = { password: fields.newPassword ?? fields.password };

        setAlert(getApiErrorMessage(error));
        setErrors(serverErrors);
        setIsNewLinkNeeded(error.code === invalidTokenCode || error.status === 400);
        focusFirstInvalid(formRef.current, fieldOrder, serverErrors);
      } else {
        setAlert(messages.apiErrors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (link === null) {
    return (
      <div aria-busy="true" aria-hidden="true" className={styles.form}>
        <Skeleton shape="block" />
        <Skeleton shape="block" />
      </div>
    );
  }

  if (!link.token) {
    return (
      <AuthMessage description={text.resetMissingDescription} title={text.resetMissingTitle}>
        <ButtonLink href={routes.forgotPassword}>{text.requestNewLink}</ButtonLink>
        <ButtonLink href={routes.login} variant="ghost">
          {text.backToLogin}
        </ButtonLink>
      </AuthMessage>
    );
  }

  if (isDone) {
    return (
      <AuthMessage description={text.resetSuccessDescription} title={text.resetSuccessTitle}>
        <ButtonLink href={routes.login}>{text.login}</ButtonLink>
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
      <h1>{text.resetTitle}</h1>
      <p>{text.resetDescription}</p>
      {alert ? <p role="alert">{alert}</p> : null}
      {isNewLinkNeeded ? (
        <ButtonLink href={routes.forgotPassword} variant="outline">
          {text.requestNewLink}
        </ButtonLink>
      ) : null}
      <Field error={errors.password} hint={text.passwordHint} label={text.newPassword} required>
        <Input
          autoComplete="new-password"
          disabled={isSubmitting}
          name="password"
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          type="password"
          value={values.password}
        />
      </Field>
      <Field error={errors.confirmPassword} label={text.confirmPassword} required>
        <Input
          autoComplete="new-password"
          disabled={isSubmitting}
          name="confirmPassword"
          onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          type="password"
          value={values.confirmPassword}
        />
      </Field>
      <Button fullWidth loading={isSubmitting} onClick={() => void submit()}>
        {text.resetPasswordButton}
      </Button>
      <ButtonLink href={routes.login} variant="ghost">
        {text.backToLogin}
      </ButtonLink>
    </form>
  );
}
