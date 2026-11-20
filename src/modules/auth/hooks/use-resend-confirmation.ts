'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/shared/lib/api';

import { getAuthApi } from '../api/auth-client';

// After a successful send the button stays disabled this long. A 429 uses the API's Retry-After instead.
export const RESEND_COOLDOWN_SECONDS = 60;

export type ResendStatus = 'idle' | 'sending' | 'sent' | 'error';

// POST /auth/resend-confirmation (202 whatever the address). One request at a time, then a cooldown, so the button
// cannot be used to flood the user's inbox. The text of an error comes from the API error tables (ar.json).
export function useResendConfirmation() {
  const [status, setStatus] = useState<ResendStatus>('idle');
  const [error, setError] = useState('');
  const [waitSeconds, setWaitSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusy = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const startCooldown = useCallback((seconds: number) => {
    setWaitSeconds(seconds);

    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => setWaitSeconds(0), seconds * 1000);
  }, []);

  const resend = useCallback(
    async (email: string) => {
      if (isBusy.current || waitSeconds > 0) {
        return;
      }

      isBusy.current = true;
      setStatus('sending');
      setError('');

      try {
        await getAuthApi().resendConfirmation(email.trim());
        setStatus('sent');
        startCooldown(RESEND_COOLDOWN_SECONDS);
      } catch (cause) {
        setStatus('error');

        if (cause instanceof ApiError) {
          setError(getApiErrorMessage(cause));

          if (cause.status === 429 && cause.retryAfterSeconds && cause.retryAfterSeconds > 0) {
            startCooldown(Math.ceil(cause.retryAfterSeconds));
          }
        } else {
          setError(getApiErrorMessage(new ApiError({ kind: 'unknown' })));
        }
      } finally {
        isBusy.current = false;
      }
    },
    [startCooldown, waitSeconds],
  );

  return { error, resend, status, waitSeconds };
}
