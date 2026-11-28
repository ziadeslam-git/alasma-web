import { getAdminApiClient } from '@/modules/auth';
import type { components, paths } from '@/shared/lib/api';

export type AdminOrderListItem = components['schemas']['AdminOrderListItemDto'];
export type AdminOrderList = components['schemas']['PagedResultOfAdminOrderListItemDto'];
export type AdminOrderStatus = components['schemas']['OrderStatus'];
export type AdminPaymentMethod = components['schemas']['PaymentMethod'];
export type AdminOrdersQuery = NonNullable<
  paths['/api/v1/admin/orders']['get']['parameters']['query']
>;
export type ShippingZone = components['schemas']['ShippingZonePublicDto'];

// GET /api/v1/admin/orders. `query` is already in the API's shape (see toAdminOrdersQuery).
export async function listAdminOrders(query: AdminOrdersQuery): Promise<AdminOrderList> {
  const result = await getAdminApiClient().GET('/api/v1/admin/orders', {
    cache: 'no-store',
    params: { query },
  });

  if (!result.data) throw new Error('Missing admin order list');

  return result.data;
}

// The public zone list feeds the zone filter. It is not an admin endpoint, so it needs no permission.
export async function listShippingZones(): Promise<ShippingZone[]> {
  const result = await getAdminApiClient().GET('/api/v1/shipping/zones', { cache: 'no-store' });

  if (!result.data) throw new Error('Missing shipping zones');

  return result.data;
}
