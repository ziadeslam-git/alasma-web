import { getUploadApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

import type { Order } from './orders-api';

type PaymentProofBody = components['schemas']['PaymentProofForm'];

export type PaymentProofInput = {
  file: File;
  transactionReference?: string;
  senderPhone?: string;
};

// The multipart fields of the contract (PaymentProofForm). There is no amount field: the API takes the order total.
export const PAYMENT_PROOF_FIELDS = {
  file: 'screenshot',
  reference: 'transactionReference',
  phone: 'senderPhone',
} as const;

export function buildPaymentProofForm(input: PaymentProofInput): FormData {
  const form = new FormData();
  form.append(PAYMENT_PROOF_FIELDS.file, input.file);
  const reference = input.transactionReference?.trim();
  const phone = input.senderPhone?.trim();
  if (reference) form.append(PAYMENT_PROOF_FIELDS.reference, reference);
  if (phone) form.append(PAYMENT_PROOF_FIELDS.phone, phone);

  return form;
}

// openapi-fetch drops its JSON Content-Type for a FormData body, so the browser sets the multipart boundary itself.
// The generated type describes the file as a string, so the real FormData goes in through the body serializer and
// the typed body is only a placeholder.
export async function submitPaymentProof(
  orderId: string,
  input: PaymentProofInput,
): Promise<Order> {
  const placeholder: PaymentProofBody = {};
  const result = await getUploadApiClient().POST('/api/v1/orders/{id}/payment-proof', {
    cache: 'no-store',
    params: { path: { id: orderId } },
    body: placeholder,
    bodySerializer: () => buildPaymentProofForm(input),
  });
  if (!result.data) throw new Error('Missing order');

  return result.data;
}
