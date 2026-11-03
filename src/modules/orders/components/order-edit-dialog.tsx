'use client';

import { useEffect, useState, type FormEvent } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Modal } from '@/shared/ui/modal';
import {
  listOrderZones,
  updateOrder,
  type Order,
  type ShippingZone,
  type UpdateOrderChanges,
} from '../api/orders-api';
import styles from './orders.module.css';

export function OrderEditDialog({
  order,
  onClose,
  onSaved,
  onConflict,
}: {
  order: Order;
  onClose: () => void;
  onSaved: (order: Order) => void;
  onConflict: () => Promise<void>;
}) {
  const text = messages.orders;
  const [recipientName, setRecipientName] = useState(order.address.recipientName);
  const [phone, setPhone] = useState(order.address.phone);
  const [city, setCity] = useState(order.address.city);
  const [addressLine, setAddressLine] = useState(order.address.addressLine);
  const [landmark, setLandmark] = useState(order.address.landmark ?? '');
  const [notes, setNotes] = useState(order.customerNotes ?? '');
  const [zoneId, setZoneId] = useState(order.address.shippingZoneId);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [isUnconfirmed, setUnconfirmed] = useState(false);
  useEffect(() => {
    let isActive = true;
    void listOrderZones()
      .then((result) => {
        if (isActive) setZones(result);
      })
      .catch((cause: unknown) => {
        if (isActive) {
          if (cause instanceof ApiError && cause.code === 'email_not_confirmed')
            setUnconfirmed(true);
          else setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
        }
      });
    return () => {
      isActive = false;
    };
  }, [text.error]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const addressFields: NonNullable<UpdateOrderChanges['addressFields']> = {
      ...(city !== order.address.city ? { city } : {}),
      ...(addressLine !== order.address.addressLine ? { addressLine } : {}),
      ...(landmark !== (order.address.landmark ?? '') ? { landmark } : {}),
    };
    const body: UpdateOrderChanges = {
      rowVersion: order.rowVersion,
      ...(recipientName !== order.address.recipientName ? { recipientName } : {}),
      ...(phone !== order.address.phone ? { phone } : {}),
      ...(order.status === 'PendingPayment' && zoneId !== order.address.shippingZoneId
        ? { zoneId }
        : {}),
      ...(notes !== (order.customerNotes ?? '') ? { notes } : {}),
      ...(Object.keys(addressFields).length ? { addressFields } : {}),
    };
    if (Object.keys(body).length === 1) return;
    setPending(true);
    setError('');
    setUnconfirmed(false);
    try {
      onSaved(await updateOrder(order.id, body));
      onClose();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'order_concurrency_conflict') {
        try {
          await onConflict();
          onClose();
        } catch {
          setError(text.error);
        }
      } else if (cause instanceof ApiError && cause.code === 'email_not_confirmed')
        setUnconfirmed(true);
      else setError(cause instanceof ApiError ? getApiErrorMessage(cause) : text.error);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
      title={text.edit}
      closeLabel={text.close}
    >
      <form className={styles.form} onSubmit={(event) => void submit(event)}>
        {error ? <p role="alert">{error}</p> : null}
        {isUnconfirmed ? <UnconfirmedEmailBanner /> : null}
        <label>
          {text.recipientName}
          <input
            data-autofocus
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
          />
        </label>
        <label>
          {text.phone}
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          {text.zone}
          <select
            value={zoneId}
            disabled={order.status !== 'PendingPayment' || zones.length === 0}
            onChange={(event) => setZoneId(Number(event.target.value))}
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.nameAr}
              </option>
            ))}
          </select>
        </label>
        {order.status !== 'PendingPayment' ? <p>{text.zoneLocked}</p> : null}
        <label>
          {text.city}
          <input value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label>
          {text.addressLine}
          <input value={addressLine} onChange={(event) => setAddressLine(event.target.value)} />
        </label>
        <label>
          {text.landmark}
          <input value={landmark} onChange={(event) => setLandmark(event.target.value)} />
        </label>
        <label>
          {text.notes}
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button disabled={isPending} type="submit">
          {text.save}
        </button>
      </form>
    </Modal>
  );
}
