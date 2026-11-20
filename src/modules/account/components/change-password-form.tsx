'use client';

import { useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import {
  focusFirstInvalid,
  mapFieldErrors,
  NewPasswordField,
  PasswordInput,
  validateChangePassword,
} from '@/modules/auth-screens';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';

import styles from './profile.module.css';

const fieldOrder = ['currentPassword', 'password', 'confirmPassword'] as const;
const wrongPasswordCode = 'auth_current_password_invalid';
const empty = { confirmPassword: '', currentPassword: '', password: '' };

// POST /auth/change-password (through useAuth().changePassword, which stores the new access token). The API ends every
// other session. All three password values are cleared from state as soon as the request is sent.
export function ChangePasswordForm() {
  const text = messages.account;
  const auth = messages.auth;
  const { changePassword } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    const found = validateChangePassword(values, auth);
    setErrors(found);

    if (focusFirstInvalid(formRef.current, fieldOrder, found)) {
      return;
    }

    const request = { currentPassword: values.currentPassword, newPassword: values.password };

    setAlert('');
    setIsDone(false);
    setIsSubmitting(true);
    setValues(empty);

    try {
      await changePassword(request);
      setIsDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = mapFieldErrors(error, ['currentPassword', 'newPassword', 'password']);
        const serverErrors = {
          currentPassword:
            error.code === wrongPasswordCode ? getApiErrorMessage(error) : fields.currentPassword,
          password: fields.newPassword ?? fields.password,
        };
        const hasFieldError = Boolean(serverErrors.currentPassword ?? serverErrors.password);

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
    <section aria-labelledby="password-section" className={styles.card}>
      <h2 id="password-section">{text.passwordSection}</h2>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        ref={formRef}
      >
        <Field error={errors.currentPassword} label={text.currentPassword} required>
          <PasswordInput
            autoComplete="current-password"
            disabled={isSubmitting}
            name="currentPassword"
            onChange={(event) => {
              setValues({ ...values, currentPassword: event.target.value });
              setIsDone(false);
            }}
            value={values.currentPassword}
          />
        </Field>
        <NewPasswordField
          disabled={isSubmitting}
          error={errors.password}
          label={auth.newPassword}
          onChange={(password) => {
            setValues({ ...values, password });
            setIsDone(false);
          }}
          value={values.password}
        />
        <Field error={errors.confirmPassword} label={auth.confirmPassword} required>
          <PasswordInput
            autoComplete="new-password"
            disabled={isSubmitting}
            name="confirmPassword"
            onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
            value={values.confirmPassword}
          />
        </Field>
        <div className={styles.actions}>
          <Button loading={isSubmitting} onClick={() => void submit()}>
            {text.changePasswordButton}
          </Button>
        </div>
        <p
          className={alert ? `${styles.status} ${styles.statusError}` : styles.status}
          role={alert ? 'alert' : 'status'}
        >
          {alert || (isDone ? text.passwordChanged : '')}
        </p>
      </form>
    </section>
  );
}
