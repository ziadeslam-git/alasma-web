'use client';

import { useState, type FormEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';

import { subscribeToNewsletter } from '../api/newsletter-api';
import styles from './newsletter-form.module.css';

// A simple shape check; the API has the final say (400 for a malformed address).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export function NewsletterForm() {
  const text = messages.newsletter;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isPending, setPending] = useState(false);
  const [isDone, setDone] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (isPending) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value) || value.length > EMAIL_MAX_LENGTH) {
      setError(text.invalidEmail);
      return;
    }
    setError('');
    setPending(true);
    try {
      await subscribeToNewsletter(value);
      setDone(true);
      setEmail('');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 400) setError(text.invalidEmail);
      else setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
    } finally {
      setPending(false);
    }
  }

  if (isDone) {
    return (
      <p className={styles.success} role="status">
        {text.success}
      </p>
    );
  }

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
      <input
        aria-describedby={error ? 'newsletter-error' : undefined}
        aria-invalid={error ? true : undefined}
        aria-label={text.emailLabel}
        autoComplete="email"
        className={error ? `${styles.field} ${styles.fieldInvalid}` : styles.field}
        dir="ltr"
        inputMode="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder={text.placeholder}
        type="email"
        value={email}
      />
      {error ? (
        <p className={styles.error} id="newsletter-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button fullWidth loading={isPending} onClick={() => void submit()}>
        {isPending ? text.submitting : text.submit}
      </Button>
    </form>
  );
}
