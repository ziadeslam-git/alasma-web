'use client';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';

import { useResendConfirmation } from '../hooks/use-resend-confirmation';
import styles from './resend-confirmation.module.css';

// The "resend the confirmation email" action: sends to `email`, then stays disabled for the cooldown. The status line
// is always in the layout (role="status" / "alert"), so a message never moves the content around it.
export function ResendConfirmation({ email }: Readonly<{ email: string }>) {
  const text = messages.account;
  const { error, resend, status, waitSeconds } = useResendConfirmation();
  const message = status === 'sent' ? text.resendSent : status === 'error' ? error : '';

  return (
    <div className={styles.resend}>
      <Button
        disabled={waitSeconds > 0}
        loading={status === 'sending'}
        onClick={() => void resend(email)}
        variant="outline"
      >
        {text.resend}
      </Button>
      <p className={styles.status} role={status === 'error' ? 'alert' : 'status'}>
        {message}
        {waitSeconds > 0 ? ` ${text.resendWait.replace('{seconds}', String(waitSeconds))}` : ''}
      </p>
    </div>
  );
}
