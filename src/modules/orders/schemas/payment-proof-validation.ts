export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PAYMENT_PROOF_MAX_REFERENCE_LENGTH = 100;
export const PAYMENT_PROOF_ACCEPTED_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const egyptianMobile = /^(?:0|\+20|0020)1\d{9}$/;

export type PaymentProofIssue =
  'fileRequired' | 'fileType' | 'fileSize' | 'fileEmpty' | 'referenceTooLong' | 'phoneInvalid';

export type PaymentProofFields = {
  file: File | null;
  reference: string;
  phone: string;
};

// A pre-check for the user's comfort only: the API stays the judge (it also checks the real file content).
export function validatePaymentProof(fields: PaymentProofFields): PaymentProofIssue | null {
  const { file } = fields;
  if (!file) return 'fileRequired';
  if (!PAYMENT_PROOF_ACCEPTED_TYPES.includes(file.type)) return 'fileType';
  if (file.size === 0) return 'fileEmpty';
  if (file.size > PAYMENT_PROOF_MAX_BYTES) return 'fileSize';
  if (fields.reference.trim().length > PAYMENT_PROOF_MAX_REFERENCE_LENGTH) {
    return 'referenceTooLong';
  }
  const phone = fields.phone.trim();
  if (phone && !egyptianMobile.test(phone)) return 'phoneInvalid';

  return null;
}
