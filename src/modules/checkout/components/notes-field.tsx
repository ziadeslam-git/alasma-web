'use client';

import messages from '@/i18n/messages/ar.json';
import { Textarea } from '@/shared/ui/input';
import { useCheckout } from '../provider/checkout-provider';
import { CheckoutPanel } from './checkout-panel';

export function NotesField() {
  const { notes, setNotes } = useCheckout();
  return (
    <CheckoutPanel step={3} title={messages.checkout.notes} titleId="checkout-notes-title">
      <Textarea
        aria-labelledby="checkout-notes-title"
        maxLength={1000}
        onChange={(event) => setNotes(event.target.value)}
        placeholder={messages.checkout.notesPlaceholder}
        value={notes}
      />
    </CheckoutPanel>
  );
}
