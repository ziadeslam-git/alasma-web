'use client';

import { useRef, useState, type FormEvent } from 'react';
import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Input } from '@/shared/ui/input';
import { previewCheckout } from '../api/preview';
import { useCheckout } from '../provider/checkout-provider';
import styles from './coupon-box.module.css';

export function CouponBox() {
  const {
    addressId,
    appliedCouponCode,
    setAppliedCouponCode,
    setPreview,
    beginPreviewRequest,
    isCurrentPreviewRequest,
    setEmailUnconfirmed,
  } = useCheckout();
  const [code, setCode] = useState('');
  const [isPending, setPending] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const text = messages.checkout;

  async function updateCoupon(couponCode: string | null) {
    if (addressId === null || pending.current) return;
    pending.current = true;
    const version = beginPreviewRequest();
    setPreview({ status: 'loading' });
    setPending(true);
    setError('');
    try {
      const data = await previewCheckout({ addressId, zoneId: null, couponCode });
      if (!isCurrentPreviewRequest(version)) return;
      setAppliedCouponCode(couponCode);
      setPreview({ status: 'ok', data });
      if (!couponCode) setCode('');
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.status === 403 &&
        cause.code === 'email_not_confirmed'
      ) {
        setEmailUnconfirmed(true);
        return;
      }
      if (!isCurrentPreviewRequest(version)) return;
      setPreview({
        status: 'error',
        message: cause instanceof ApiError ? getApiErrorMessage(cause) : text.previewError,
      });
      setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.previewError);
    } finally {
      pending.current = false;
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    if (value) void updateCoupon(value);
  }

  return (
    <section className={styles.box}>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          <span className={styles.srOnly}>{text.couponLabel}</span>
          <Input
            onChange={(event) => setCode(event.target.value)}
            placeholder={text.couponLabel}
            value={code}
          />
        </label>
        <button
          className={styles.apply}
          disabled={isPending || addressId === null || !code.trim()}
          type="submit"
        >
          {text.couponApply}
        </button>
      </form>
      {appliedCouponCode ? (
        <p className={styles.applied}>
          {text.couponApplied}: <bdi>{appliedCouponCode}</bdi>{' '}
          <button
            className={styles.remove}
            disabled={isPending || addressId === null}
            onClick={() => void updateCoupon(null)}
            type="button"
          >
            {text.couponRemove}
          </button>
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
