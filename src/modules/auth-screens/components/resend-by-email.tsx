'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { useResendConfirmation } from '@/modules/auth';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { validateForgotPassword } from '../validation';
import styles from './form.module.css';

// Resend the confirmation email when the visitor is not signed in (an expired or used link): the address is asked for,
// because the API takes it in the body. The answer is 202 whatever the address, so the success text is neutral.
export function ResendByEmail() {
  const text = messages.auth;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const { error: sendError, resend, status, waitSeconds } = useResendConfirmation();
  const message = status === 'sent' ? text.resendNeutral : status === 'error' ? sendError : '';

  const submit = () => {
    const found = validateForgotPassword({ email }, text).email;
    setError(found);

    if (!found) {
      void resend(email);
    }
  };

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Field error={error} label={text.email} required>
        <Input
          autoComplete="email"
          dir="ltr"
          disabled={status === 'sending'}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </Field>
      <Button
        disabled={waitSeconds > 0}
        fullWidth
        loading={status === 'sending'}
        onClick={submit}
        variant="outline"
      >
        {text.resendConfirmation}
      </Button>
      <p role={status === 'error' ? 'alert' : 'status'}>
        {message}
        {waitSeconds > 0
          ? ` ${messages.account.resendWait.replace('{seconds}', String(waitSeconds))}`
          : ''}
      </p>
    </form>
  );
}
