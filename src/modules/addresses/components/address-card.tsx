'use client';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import type { Address } from '../api/addresses';
import styles from './addresses.module.css';

// design/Addresses.dc.html .ad: header (pin + recipient, default tag), the address lines, phone and ship-to meta, and a
// footer with edit, "make default" and an icon-only delete. The design's home/work label has no API field: not drawn.
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
    <article className={`${styles.card} ${address.isDefault ? styles.cardDefault : ''}`}>
      <div className={styles.cardHead}>
        <h2>
          <Icon name="pin" />
          {address.recipientName}
        </h2>
        {address.isDefault ? <span className={styles.tag}>{text.default}</span> : null}
      </div>
      <p className={styles.lines}>
        {address.addressLine}
        <br />
        {address.governorateName} - {address.city}
        {address.landmark ? (
          <>
            <br />
            {address.landmark}
          </>
        ) : null}
      </p>
      <div className={styles.meta}>
        <span dir="ltr">
          <Icon name="user" size="sm" />
          {address.phone}
        </span>
        <span>
          <Icon name="truck" size="sm" />
          {text.shipsTo.replace('{governorate}', address.governorateName)}
        </span>
      </div>
      <div className={styles.cardFoot}>
        <Button leadingIcon="settings" onClick={() => onEdit(address)} size="sm" variant="outline">
          {text.edit}
        </Button>
        {!address.isDefault ? (
          <Button onClick={() => onDefault(address)} size="sm" variant="soft">
            {text.setDefault}
          </Button>
        ) : null}
        <Button
          className={styles.danger}
          label={text.delete}
          leadingIcon="trash"
          onClick={() => onDelete(address)}
          size="sm"
          variant="outline"
        />
      </div>
    </article>
  );
}
