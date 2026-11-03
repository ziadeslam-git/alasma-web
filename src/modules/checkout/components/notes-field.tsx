'use client';

import messages from '@/i18n/messages/ar.json';
import { useCheckout } from '../provider/checkout-provider';

export function NotesField() {
  const { notes, setNotes } = useCheckout();
  return (
    <label>
      {messages.checkout.notes}
      <textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} />
    </label>
  );
}
