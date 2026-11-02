'use client';

import messages from '@/i18n/messages/ar.json';
import type { Address } from '../api/addresses';
import styles from './addresses.module.css';

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onDefault,
}: {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onDefault: (address: Address) => void;
}) {
  const text = messages.addresses;
  return (
    <article className={styles.card}>
      <h2>{address.recipientName}</h2>
      {address.isDefault ? <p>{text.default}</p> : null}
      <p>{address.phone}</p>
      <p>
        {address.governorateName} - {address.city}
      </p>
      <p>{address.addressLine}</p>
      {address.landmark ? <p>{address.landmark}</p> : null}
      <div className={styles.actions}>
        <button type="button" onClick={() => onEdit(address)}>
          {text.edit}
        </button>
        <button type="button" onClick={() => onDelete(address)}>
          {text.delete}
        </button>
        {!address.isDefault ? (
          <button type="button" onClick={() => onDefault(address)}>
            {text.setDefault}
          </button>
        ) : null}
      </div>
    </article>
  );
}
