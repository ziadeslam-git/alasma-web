'use client';

import { useState, type FormEvent } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import type { Address, AddressInput, ShippingZone } from '../api/addresses';
import styles from './addresses.module.css';

const phonePattern = /^(?:0|\+20|0020)1\d{9}$/;
type FormKey = 'recipientName' | 'phone' | 'city' | 'addressLine' | 'landmark';
const formKeys: readonly FormKey[] = ['recipientName', 'phone', 'city', 'addressLine', 'landmark'];

export function AddressForm({
  address,
  zones,
  onSave,
  onCancel,
}: {
  address?: Address | undefined;
  zones: readonly ShippingZone[];
  onSave: (input: AddressInput) => Promise<void>;
  onCancel: () => void;
}) {
  const text = messages.addresses;
  const [values, setValues] = useState({
    recipientName: address?.recipientName ?? '',
    phone: address?.phone ?? '',
    city: address?.city ?? '',
    addressLine: address?.addressLine ?? '',
    landmark: address?.landmark ?? '',
    shippingZoneId: String(address?.shippingZoneId ?? ''),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isEmailUnconfirmed, setEmailUnconfirmed] = useState(false);
  const zone = zones.find((item) => String(item.id) === values.shippingZoneId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    for (const field of ['recipientName', 'phone', 'city', 'addressLine'] as const)
      if (!values[field].trim()) next[field] = text.invalid;
    if (values.phone && !phonePattern.test(values.phone.replace(/[\s-]/g, '')))
      next.phone = text.invalid;
    if (!zone) next.shippingZoneId = text.invalid;
    setErrors(next);
    if (Object.keys(next).length || !zone) return;
    setBusy(true);
    setError('');
    setEmailUnconfirmed(false);
    try {
      await onSave({
        ...values,
        shippingZoneId: zone.id,
        landmark: values.landmark.trim() || null,
      });
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.status === 403 &&
        caught.code === 'email_not_confirmed'
      ) {
        setEmailUnconfirmed(true);
        return;
      }
      if (caught instanceof ApiError && (caught.status === 400 || caught.status === 422)) {
        const fields: Record<string, string> = {};
        for (const key of Object.keys(caught.errors)) {
          const match = [...formKeys, 'shippingZoneId'].find(
            (item) => item.toLowerCase() === key.toLowerCase(),
          );
          if (match) fields[match] = text.invalid;
        }
        setErrors(fields);
      }
      setError(
        caught instanceof ApiError ? getApiErrorMessage(caught) : messages.apiErrors.generic,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className={styles.form} noValidate>
      {formKeys.map((field) => (
        <label key={field}>
          {text[field]}
          <input
            value={values[field]}
            onChange={(event) => setValues({ ...values, [field]: event.target.value })}
            aria-invalid={Boolean(errors[field])}
            aria-describedby={errors[field] ? `address-error-${field}` : undefined}
          />
          {errors[field] ? <span id={`address-error-${field}`}>{errors[field]}</span> : null}
        </label>
      ))}
      <label>
        {text.shippingZoneId}
        <select
          value={values.shippingZoneId}
          onChange={(event) => setValues({ ...values, shippingZoneId: event.target.value })}
          aria-invalid={Boolean(errors.shippingZoneId)}
          aria-describedby={errors.shippingZoneId ? 'address-error-zone' : undefined}
        >
          <option value="">{text.chooseZone}</option>
          {zones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nameAr}
            </option>
          ))}
        </select>
        {errors.shippingZoneId ? (
          <span id="address-error-zone">{errors.shippingZoneId}</span>
        ) : null}
      </label>
      {zone ? (
        <div>
          <p>
            {text.shippingPrice}: {formatMoney(zone.shippingPrice)}
          </p>
          {zone.freeShippingThreshold !== null ? (
            <p>
              {text.freeShippingThreshold}: {formatMoney(zone.freeShippingThreshold)}
            </p>
          ) : null}
          {zone.estimatedDays !== null ? (
            <p>
              {text.estimatedDays}: {formatNumber(zone.estimatedDays)}
            </p>
          ) : null}
        </div>
      ) : null}
      {isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className={styles.actions}>
        <button type="submit" disabled={isBusy}>
          {text.save}
        </button>
        <button type="button" onClick={onCancel} disabled={isBusy}>
          {text.cancel}
        </button>
      </div>
    </form>
  );
}
