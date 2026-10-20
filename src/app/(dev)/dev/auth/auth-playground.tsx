'use client';

import { useState, type FormEvent } from 'react';

import messages from '@/i18n/messages/ar.json';
import { ensureFreshSession, getApiClient, useAuth } from '@/modules/auth';
import { getApiErrorMessage, parseThrownError } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import styles from './auth.module.css';

// Shows the session state without ever showing the access token: status, name and role only.
export function AuthPlayground() {
  const text = messages.devAuth;
  const { login, logout, status, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [errorText, setErrorText] = useState('');

  const run = async (action: () => Promise<string>) => {
    setErrorText('');

    try {
      setResult(await action());
    } catch (error) {
      setErrorText(getApiErrorMessage(parseThrownError(error)));
    }
  };

  const submit = () =>
    void run(async () => {
      await login({ email, password });

      return text.login;
    });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const callMeTwice = () =>
    run(async () => {
      const calls = await Promise.all([
        getApiClient().GET('/api/v1/me'),
        getApiClient().GET('/api/v1/me'),
      ]);

      return calls.map(({ data }) => data?.fullName ?? text.none).join(' | ');
    });

  const forceRefresh = () =>
    run(async () => {
      await ensureFreshSession({ force: true });

      return text.refreshDone;
    });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{text.title}</h1>
      <dl className={styles.facts}>
        <dt>{text.statusLabel}</dt>
        <dd data-testid="auth-status">{text.statusNames[status]}</dd>
        <dt>{text.nameLabel}</dt>
        <dd>{user?.fullName ?? text.none}</dd>
        <dt>{text.roleLabel}</dt>
        <dd>{user?.roles.join(', ') || text.none}</dd>
      </dl>
      <form className={styles.form} onSubmit={onSubmit}>
        <Field label={text.emailLabel}>
          <Input
            autoComplete="off"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </Field>
        <Field label={text.passwordLabel}>
          <Input
            autoComplete="off"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </Field>
        <div className={styles.row}>
          <Button onClick={() => submit()}>{text.login}</Button>
          <Button onClick={() => void logout()} variant="soft">
            {text.logout}
          </Button>
        </div>
      </form>
      <div className={styles.row}>
        <Button onClick={() => void callMeTwice()} variant="soft">
          {text.callMeTwice}
        </Button>
        <Button onClick={() => void forceRefresh()} variant="soft">
          {text.forceRefresh}
        </Button>
      </div>
      <p aria-live="polite" className={styles.result} data-testid="auth-result">
        {errorText ? `${text.errorLabel}: ${errorText}` : result}
      </p>
    </div>
  );
}
