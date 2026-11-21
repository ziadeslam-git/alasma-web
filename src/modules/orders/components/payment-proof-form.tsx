'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { submitPaymentProof } from '../api/payment-proof-api';
import type { Order } from '../api/orders-api';
import {
  PAYMENT_PROOF_ACCEPTED_TYPES,
  validatePaymentProof,
  type PaymentProofIssue,
} from '../schemas/payment-proof-validation';
import styles from './payment-proof.module.css';

const TOO_MANY_REQUESTS = 429;
const PROOF_ISSUE_KEYS = {
  fileRequired: 'proofFileRequired',
  fileType: 'proofFileType',
  fileSize: 'proofFileSize',
  fileEmpty: 'proofFileEmpty',
  referenceTooLong: 'proofReferenceTooLong',
  phoneInvalid: 'proofPhoneInvalid',
} as const satisfies Record<PaymentProofIssue, keyof typeof messages.orders>;

type Selection = { file: File; previewUrl: string | null };

function uploadErrorMessage(cause: unknown): string {
  const text = messages.orders;
  if (!(cause instanceof ApiError)) return messages.apiErrors.generic;
  const base = getApiErrorMessage(cause);
  if (cause.status === TOO_MANY_REQUESTS && cause.retryAfterSeconds !== undefined) {
    return `${base} ${text.retryAfter.replace('{seconds}', String(cause.retryAfterSeconds))}`;
  }

  return base;
}

export function PaymentProofForm({
  order,
  onSubmitted,
}: {
  order: Order;
  onSubmitted: (order: Order) => void;
}) {
  const text = messages.orders;
  const [selection, setSelection] = useState<Selection | null>(null);
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [issue, setIssue] = useState<PaymentProofIssue | null>(null);
  const [error, setError] = useState('');
  const [isUnconfirmed, setUnconfirmed] = useState(false);
  const [isPending, setPending] = useState(false);
  const previewRef = useRef<string | null>(null);

  // The local preview is an object URL: it is released when the file changes and when the form goes away.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setError('');
    if (!file) {
      setSelection(null);
      setIssue(null);
      return;
    }
    const canPreview = PAYMENT_PROOF_ACCEPTED_TYPES.includes(file.type);
    previewRef.current = canPreview ? URL.createObjectURL(file) : null;
    setSelection({ file, previewUrl: previewRef.current });
    setIssue(validatePaymentProof({ file, reference, phone }));
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (isPending) return;
    const found = validatePaymentProof({ file: selection?.file ?? null, reference, phone });
    setIssue(found);
    if (found || !selection) return;
    setPending(true);
    setError('');
    setUnconfirmed(false);
    try {
      onSubmitted(
        await submitPaymentProof(order.id, {
          file: selection.file,
          transactionReference: reference,
          senderPhone: phone,
        }),
      );
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'email_not_confirmed') setUnconfirmed(true);
      else setError(uploadErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  const message = issue ? text[PROOF_ISSUE_KEYS[issue]] : error;

  return (
    <form
      aria-labelledby="payment-proof-title"
      className={styles.form}
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <h3 id="payment-proof-title">{text.proofTitle}</h3>
      {message ? <p role="alert">{message}</p> : null}
      {isUnconfirmed ? <UnconfirmedEmailBanner /> : null}
      <label className={styles.field}>
        {text.proofFile}
        <input
          accept={PAYMENT_PROOF_ACCEPTED_TYPES.join(',')}
          aria-describedby="payment-proof-hint"
          aria-invalid={issue === 'fileType' || issue === 'fileSize' || issue === 'fileEmpty'}
          className={styles.file}
          disabled={isPending}
          onChange={choose}
          type="file"
        />
      </label>
      <p className={styles.hint} id="payment-proof-hint">
        {text.proofFileHint}
      </p>
      {selection?.previewUrl ? (
        // A local blob preview of the chosen file: next/image has nothing to optimise here.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={text.proofPreviewAlt} className={styles.preview} src={selection.previewUrl} />
      ) : null}
      <label className={styles.field}>
        {text.proofReference}
        <Input
          aria-invalid={issue === 'referenceTooLong'}
          autoComplete="off"
          dir="ltr"
          disabled={isPending}
          onChange={(event) => setReference(event.target.value)}
          value={reference}
        />
      </label>
      <label className={styles.field}>
        {text.proofPhone}
        <Input
          aria-invalid={issue === 'phoneInvalid'}
          autoComplete="tel"
          dir="ltr"
          disabled={isPending}
          inputMode="tel"
          onChange={(event) => setPhone(event.target.value)}
          type="tel"
          value={phone}
        />
      </label>
      <Button loading={isPending} onClick={() => void submit()}>
        {isPending ? text.proofUploading : text.proofSubmit}
      </Button>
    </form>
  );
}
