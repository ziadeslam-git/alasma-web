'use client';

import { useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { FeatureGate } from '@/shared/ui/soon';
import type { OrderStatus } from '../api/orders-api';
import { openOrderInvoice } from '../lib/open-order-invoice';
import { printableErrorMessage } from '../lib/printable-error-message';
import styles from './payment-proof.module.css';

// The API serves an invoice only from Confirmed through Delivered (422 invoice_not_available otherwise).
const INVOICE_STATUSES: readonly OrderStatus[] = ['Confirmed', 'Preparing', 'Shipped', 'Delivered'];

export const isInvoiceAvailable = (status: OrderStatus) => INVOICE_STATUSES.includes(status);

export function OrderInvoiceButton({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const text = messages.orders;
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState('');
  if (!isInvoiceAvailable(status)) return null;
  async function open() {
    setPending(true);
    setError('');
    try {
      await openOrderInvoice(orderId);
    } catch (cause) {
      setError(printableErrorMessage(cause, text.invoiceUnavailable));
    } finally {
      setPending(false);
    }
  }

  return (
    <FeatureGate feature="order-invoice" label={messages.site.soon}>
      <div className={styles.receipt}>
        <Button loading={isPending} onClick={() => void open()} variant="outline">
          {isPending ? text.invoiceLoading : text.invoiceView}
        </Button>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </FeatureGate>
  );
}
