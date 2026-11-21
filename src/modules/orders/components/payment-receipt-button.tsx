'use client';

import { useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { openPaymentReceipt } from '../lib/open-payment-receipt';
import { printableErrorMessage } from '../lib/printable-error-message';
import styles from './payment-proof.module.css';

export function PaymentReceiptButton({
  orderId,
  paymentId,
}: {
  orderId: string;
  paymentId: string;
}) {
  const text = messages.orders;
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function open() {
    setPending(true);
    setError('');
    try {
      await openPaymentReceipt(orderId, paymentId);
    } catch (cause) {
      setError(printableErrorMessage(cause, text.receiptUnavailable));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.receipt}>
      <Button loading={isPending} onClick={() => void open()} variant="outline">
        {isPending ? text.receiptLoading : text.receiptView}
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
