import messages from '@/i18n/messages/ar.json';

import type { Order } from '../api/orders-api';
import styles from './order-details.module.css';

export function OrderAddressPanel({ order }: { order: Order }) {
  const text = messages.orders;
  const { address } = order;
  return (
    <section aria-labelledby="order-address-heading" className={styles.panel}>
      <h2 id="order-address-heading">{text.address}</h2>
      <p className={styles.address}>
        <b>{address.recipientName}</b>
        <br />
        {[address.governorateName, address.city, address.addressLine, address.landmark]
          .filter(Boolean)
          .join(' · ')}
        <br />
        <span dir="ltr">{address.phone}</span>
      </p>
    </section>
  );
}
