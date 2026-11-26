'use client';

import messages from '@/i18n/messages/ar.json';
import { useCheckout } from '../provider/checkout-provider';
import { CheckoutPanel } from './checkout-panel';
import styles from './notes-field.module.css';

export function NotesField() {
  const { notes, setNotes } = useCheckout();
  return (
    <CheckoutPanel step={3} title={messages.checkout.notes} titleId="checkout-notes-title">
      <textarea
        aria-labelledby="checkout-notes-title"
        className={styles.textarea}
        maxLength={1000}
        onChange={(event) => setNotes(event.target.value)}
        placeholder={messages.checkout.notesPlaceholder}
        value={notes}
      />
    </CheckoutPanel>
  );
}
