import { describe, expect, it } from 'vitest';
import {
  PAYMENT_PROOF_MAX_BYTES,
  validatePaymentProof,
  type PaymentProofFields,
} from './payment-proof-validation';

function fileOf(type: string, size = 10): File {
  const file = new File(['x'], 'receipt', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const valid: PaymentProofFields = { file: fileOf('image/png'), reference: '', phone: '' };

describe('payment proof pre-validation', () => {
  it('accepts JPEG, PNG and WebP up to exactly 5 MB', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validatePaymentProof({ ...valid, file: fileOf(type) })).toBeNull();
    }
    expect(PAYMENT_PROOF_MAX_BYTES).toBe(5_242_880);
    expect(validatePaymentProof({ ...valid, file: fileOf('image/png', 5_242_880) })).toBeNull();
  });

  it('requires a file', () => {
    expect(validatePaymentProof({ ...valid, file: null })).toBe('fileRequired');
  });

  it.each(['application/pdf', 'image/gif', 'text/plain', ''])('rejects the type "%s"', (type) => {
    expect(validatePaymentProof({ ...valid, file: fileOf(type) })).toBe('fileType');
  });

  it('rejects an empty file and a file one byte over 5 MB', () => {
    expect(validatePaymentProof({ ...valid, file: fileOf('image/png', 0) })).toBe('fileEmpty');
    expect(validatePaymentProof({ ...valid, file: fileOf('image/png', 5_242_881) })).toBe(
      'fileSize',
    );
  });

  it('limits the transaction reference to 100 characters', () => {
    expect(validatePaymentProof({ ...valid, reference: 'a'.repeat(100) })).toBeNull();
    expect(validatePaymentProof({ ...valid, reference: 'a'.repeat(101) })).toBe('referenceTooLong');
  });

  it.each(['01012345678', '+201012345678', '00201012345678', ' 01112345678 ', ''])(
    'accepts the sender phone "%s"',
    (phone) => {
      expect(validatePaymentProof({ ...valid, phone })).toBeNull();
    },
  );

  it.each(['12345', '0212345678', '0101234567', '010123456789', 'abc'])(
    'rejects the sender phone "%s"',
    (phone) => {
      expect(validatePaymentProof({ ...valid, phone })).toBe('phoneInvalid');
    },
  );
});
