import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

type CreateOrderRequest = components['schemas']['CreateOrderRequest'];
type Order = components['schemas']['OrderDetailsDto'];

export async function createOrder(body: CreateOrderRequest, key: string): Promise<Order> {
  const result = await getApiClient().POST('/api/v1/orders', {
    params: { header: { 'Idempotency-Key': key } },
    body,
    cache: 'no-store',
  });
  if (!result.data) throw new Error('Missing order response');
  return result.data;
}
