import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type PaymentMethod = components['schemas']['PaymentMethodDto'];

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const result = await getApiClient().GET('/api/v1/payment-methods', { cache: 'no-store' });
  if (!result.data) throw new Error('Missing payment methods response');
  return result.data.map((method) => ({ ...method, details: method.details ?? null }));
}
