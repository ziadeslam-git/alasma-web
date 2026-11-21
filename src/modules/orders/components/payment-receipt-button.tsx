'use client';

import { useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { openPaymentReceipt, ReceiptPopupBlockedError } from '../lib/open-payment-receipt';
import styles from './payment-proof.module.css';

const NOT_FOUND_STATUS = 404;

// A 404 here also covers a closed backend flag, so it is "not available right now", never "order not found".
function receiptErrorMessage(cause: unknown): string {
  const text = messages.orders;
  if (cause instanceof ReceiptPopupBlockedError) return text.receiptPopupBlocked;
  if (cause instanceof ApiError) {
    return cause.status === NOT_FOUND_STATUS ? text.receiptUnavailable : getApiErrorMessage(cause);
  }

  return text.receiptUnavailable;
}

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
      setError(receiptErrorMessage(cause));
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
