'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { ensureFreshSession, getApiClient, useAuth } from '@/modules/auth';
import { routes } from '@/shared/config/routes';
import { ApiError } from '@/shared/lib/api';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { FeatureGate } from '@/shared/ui/soon';

import { useLinkParams } from '../use-link-params';
import { AuthMessage } from './auth-message';
import styles from './form.module.css';

type ConfirmState = 'loading' | 'success' | 'invalid' | 'network';

export function ConfirmEmailView() {
  const text = messages.auth;
  const link = useLinkParams();
  const { status } = useAuth();
  const [state, setState] = useState<ConfirmState>('loading');
  // The token is single-use: the page itself calls the API once. Only the retry button (after a network failure)
  // may call again.
  const hasCalled = useRef(false);
  const hasRefreshed = useRef(false);

  const confirm = useCallback(async (token: string, userId: number) => {
    setState('loading');

    try {
      await getApiClient().POST('/api/v1/auth/confirm-email', { body: { token, userId } });
      setState('success');
    } catch (error) {
      const isNetwork =
        error instanceof ApiError && (error.kind === 'network' || error.kind === 'timeout');
      setState(isNetwork ? 'network' : 'invalid');
    }
  }, []);

  useEffect(() => {
    if (link === null || hasCalled.current) {
      return;
    }

    hasCalled.current = true;

    if (!link.token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the link is only readable after mount
      setState('invalid');

      return;
    }

    void confirm(link.token, link.userId);
  }, [confirm, link]);

  // The access token carries email_verified: a signed-in visitor gets a new one right after the confirmation.
  useEffect(() => {
    if (state !== 'success' || status !== 'authenticated' || hasRefreshed.current) {
      return;
    }

    hasRefreshed.current = true;
    ensureFreshSession({ force: true }).catch(() => undefined);
  }, [state, status]);

  if (state === 'loading') {
    return (
      <div aria-busy="true" className={styles.form}>
        <h1>{text.confirmLoadingTitle}</h1>
        <p>{text.confirmLoadingDescription}</p>
        <Skeleton shape="block" />
      </div>
    );
  }

  if (state === 'success') {
    return (
      <AuthMessage description={text.confirmSuccessDescription} title={text.confirmSuccessTitle}>
        {status === 'authenticated' ? (
          <ButtonLink href={routes.books}>{text.continueToStore}</ButtonLink>
        ) : (
          <ButtonLink href={routes.login}>{text.login}</ButtonLink>
        )}
      </AuthMessage>
    );
  }

  if (state === 'network') {
    return (
      <AuthMessage description={messages.apiErrors.kind.network} title={text.confirmNetworkTitle}>
        <Button
          fullWidth
          onClick={() => {
            if (link?.token) {
              void confirm(link.token, link.userId);
            }
          }}
        >
          {text.retry}
        </Button>
        <ButtonLink href={routes.login} variant="ghost">
          {text.backToLogin}
        </ButtonLink>
      </AuthMessage>
    );
  }

  return (
    <AuthMessage
      description={
        link?.token ? messages.apiErrors.codes.auth_invalid_token : text.confirmMissingDescription
      }
      title={text.confirmInvalidTitle}
    >
      <FeatureGate feature="resend-confirmation" label={text.soonBadge}>
        <Button disabled fullWidth variant="outline">
          {text.resendConfirmation}
        </Button>
      </FeatureGate>
      <ButtonLink href={routes.login} variant="ghost">
        {text.backToLogin}
      </ButtonLink>
    </AuthMessage>
  );
}
