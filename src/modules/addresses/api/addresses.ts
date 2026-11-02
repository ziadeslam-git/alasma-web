import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type Address = components['schemas']['AddressDto'];
export type AddressInput = components['schemas']['CreateAddressRequest'];
export type ShippingZone = components['schemas']['ShippingZonePublicDto'];

export async function listAddresses() {
  const result = await getApiClient().GET('/api/v1/me/addresses', { cache: 'no-store' });
  return result.data ?? [];
}
export async function getAddress(id: number) {
  const result = await getApiClient().GET('/api/v1/me/addresses/{id}', {
    cache: 'no-store',
    params: { path: { id } },
  });
  return result.data;
}
export async function listShippingZones() {
  const result = await getApiClient().GET('/api/v1/shipping/zones');
  return result.data ?? [];
}
export async function createAddress(body: AddressInput) {
  return getApiClient().POST('/api/v1/me/addresses', { body });
}
export async function updateAddress(id: number, body: AddressInput) {
  return getApiClient().PUT('/api/v1/me/addresses/{id}', { params: { path: { id } }, body });
}
export async function deleteAddress(id: number) {
  return getApiClient().DELETE('/api/v1/me/addresses/{id}', { params: { path: { id } } });
}
export async function setDefaultAddress(id: number) {
  return getApiClient().PUT('/api/v1/me/addresses/{id}/default', { params: { path: { id } } });
}
