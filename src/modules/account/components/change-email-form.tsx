'use client';

import { useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import {
  focusFirstInvalid,
  mapFieldErrors,
  PasswordInput,
  validateChangeEmail,
} from '@/modules/auth-screens';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { requestEmailChange } from '../api/profile-api';
import styles from './profile.module.css';

const fieldOrder = ['newEmail', 'currentPassword'] as const;
const wrongPasswordCode = 'auth_current_password_invalid';

// POST /me/email. The API answers 202 whatever the new address is and changes the email ONLY after the link sent to
// the new address is opened, so the success text says exactly that and the current email stays shown as it is.
export function ChangeEmailForm() {
  const text = messages.account;
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ currentPassword: '', newEmail: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    const found = validateChangeEmail(values, messages.auth);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    setAlert('');
    setIsSent(false);
    setIsSubmitting(true);

    try {
      await requestEmailChange({
        currentPassword: values.currentPassword,
        newEmail: values.newEmail.trim(),
      });
      setValues({ currentPassword: '', newEmail: '' });
      setIsSent(true);
    } catch (error) {
      // The password never stays in state after a request, whatever the answer was.
      setValues((current) => ({ ...current, currentPassword: '' }));

      if (error instanceof ApiError) {
        const fields = mapFieldErrors(error, ['newEmail', 'currentPassword']);
        const serverErrors = {
          currentPassword:
            error.code === wrongPasswordCode ? getApiErrorMessage(error) : fields.currentPassword,
          newEmail: fields.newEmail,
        };
        const hasFieldError = Boolean(serverErrors.currentPassword ?? serverErrors.newEmail);

        setErrors(serverErrors);
        setAlert(hasFieldError ? '' : getApiErrorMessage(error));
        focusFirstInvalid(formRef.current, fieldOrder, serverErrors);
      } else {
        setAlert(messages.apiErrors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="email-section" className={styles.card}>
      <h2 id="email-section">{text.emailSection}</h2>
      {user ? (
        <p className={styles.currentEmail}>
          {text.currentEmail}: <bdi dir="ltr">{user.email}</bdi>
        </p>
      ) : null}
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        ref={formRef}
      >
        <Field error={errors.newEmail} label={text.newEmail} required>
          <Input
            autoComplete="email"
            dir="ltr"
            disabled={isSubmitting}
            name="newEmail"
            onChange={(event) => {
              setValues({ ...values, newEmail: event.target.value });
              setIsSent(false);
            }}
            type="email"
            value={values.newEmail}
          />
        </Field>
        <Field error={errors.currentPassword} label={text.currentPassword} required>
          <PasswordInput
            autoComplete="current-password"
            disabled={isSubmitting}
            name="currentPassword"
            onChange={(event) => setValues({ ...values, currentPassword: event.target.value })}
            value={values.currentPassword}
          />
        </Field>
        <div className={styles.actions}>
          <Button loading={isSubmitting} onClick={() => void submit()}>
            {text.changeEmailButton}
          </Button>
        </div>
        <p
          className={alert ? `${styles.status} ${styles.statusError}` : styles.status}
          role={alert ? 'alert' : 'status'}
        >
          {alert || (isSent ? text.emailChangeSent : '')}
        </p>
      </form>
    </section>
  );
}
