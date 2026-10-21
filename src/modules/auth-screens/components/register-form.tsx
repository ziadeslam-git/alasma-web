'use client';

import { useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { getAuthApi } from '@/modules/auth';
import { routes, staticPageRoute } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button, ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { FeatureGate } from '@/shared/ui/soon';

import { focusFirstInvalid, mapFieldErrors } from '../field-errors';
import { validateRegister } from '../validation';
import styles from './form.module.css';

const fieldOrder = ['fullName', 'email', 'phone', 'password', 'confirmPassword', 'terms'] as const;

export function RegisterForm() {
  const text = messages.auth;
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
    phone: '',
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    const found = validateRegister(values, text);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    setAlert('');
    setIsSubmitting(true);

    try {
      // confirmPassword and terms are checked here only; the API does not take them
      await getAuthApi().register({
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        password: values.password,
        phone: values.phone.trim(),
      });
      setIsDone(true);
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

  // No automatic sign-in: the account must be confirmed from the email first.
  if (isDone) {
    return (
      <>
        <EmptyState
          action={<ButtonLink href={routes.login}>{text.login}</ButtonLink>}
          description={text.registerSuccessDescription}
          icon="check-c"
          title={text.registerSuccessTitle}
        />
        <FeatureGate feature="resend-confirmation" label={text.soonBadge}>
          <Button disabled fullWidth variant="outline">
            {text.resendConfirmation}
          </Button>
        </FeatureGate>
      </>
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
      <h1>{text.registerTitle}</h1>
      <p>{text.registerDescription}</p>
      {alert ? <p role="alert">{alert}</p> : null}
      <Field error={errors.fullName} label={text.fullName} required>
        <Input
          autoComplete="name"
          disabled={isSubmitting}
          name="fullName"
          onChange={(event) => setValues({ ...values, fullName: event.target.value })}
          value={values.fullName}
        />
      </Field>
      <Field error={errors.email} label={text.email} required>
        <Input
          autoComplete="email"
          disabled={isSubmitting}
          name="email"
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          type="email"
          value={values.email}
        />
      </Field>
      <Field error={errors.phone} label={text.phone} required>
        <Input
          autoComplete="tel"
          disabled={isSubmitting}
          name="phone"
          onChange={(event) => setValues({ ...values, phone: event.target.value })}
          type="tel"
          value={values.phone}
        />
      </Field>
      <Field error={errors.password} hint={text.passwordHint} label={text.password} required>
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
      <label>
        <input
          aria-invalid={errors.terms ? true : undefined}
          checked={values.terms}
          disabled={isSubmitting}
          name="terms"
          onChange={(event) => setValues({ ...values, terms: event.target.checked })}
          type="checkbox"
        />{' '}
        {text.terms}
      </label>
      <ButtonLink href={staticPageRoute('terms')} variant="ghost">
        {text.termsLink}
      </ButtonLink>
      {errors.terms ? <p role="alert">{errors.terms}</p> : null}
      <Button fullWidth loading={isSubmitting} onClick={() => void submit()}>
        {text.register}
      </Button>
      <p>
        {text.hasAccount}{' '}
        <ButtonLink href={routes.login} variant="ghost">
          {text.login}
        </ButtonLink>
      </p>
    </form>
  );
}
