import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type Order = components['schemas']['OrderDetailsDto'];
export type OrderList = components['schemas']['PagedResultOfOrderListItemDto'];
export type OrderStatus = components['schemas']['OrderStatus'];
export type PaymentStatus = components['schemas']['PaymentStatus'];
export type UpdateOrder = components['schemas']['UpdateOrderRequest'];
export type ShippingZone = components['schemas']['ShippingZonePublicDto'];

// The generated request marks nullable properties required, while the endpoint applies supplied fields only.
export function serializeOrderChanges(body: UpdateOrder): string {
  return JSON.stringify(body, (_key, value: unknown) => (value === null ? undefined : value));
}

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'PendingPayment',
  'PaymentReview',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Delivered',
  'Cancelled',
];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isOrderId = (id: string) => uuid.test(id);

export async function listOrders(page: number, status?: OrderStatus): Promise<OrderList> {
  const result = await getApiClient().GET('/api/v1/orders', {
    cache: 'no-store',
    params: { query: { page, pageSize: 48, ...(status ? { status } : {}) } },
  });
  if (!result.data) throw new Error('Missing order list');
  return result.data;
}

export async function getOrder(id: string): Promise<Order> {
  const result = await getApiClient().GET('/api/v1/orders/{id}', {
    cache: 'no-store',
    params: { path: { id } },
  });
  if (!result.data) throw new Error('Missing order');
  return result.data;
}

export async function updateOrder(id: string, body: UpdateOrder): Promise<Order> {
  const result = await getApiClient().PUT('/api/v1/orders/{id}', {
    cache: 'no-store',
    params: { path: { id } },
    body,
    bodySerializer: serializeOrderChanges,
  });
  return result.data ?? getOrder(id);
}

export async function cancelOrder(id: string): Promise<Order> {
  const result = await getApiClient().POST('/api/v1/orders/{id}/cancel', {
    cache: 'no-store',
    params: { path: { id } },
    body: { reason: null },
  });
  return result.data ?? getOrder(id);
}

export async function listOrderZones(): Promise<ShippingZone[]> {
  const result = await getApiClient().GET('/api/v1/shipping/zones', { cache: 'no-store' });
  if (!result.data) throw new Error('Missing zones');
  return result.data;
}
