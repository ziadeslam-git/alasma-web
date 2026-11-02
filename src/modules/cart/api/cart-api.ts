import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type Cart = components['schemas']['CartDto'];
export type CartItem = components['schemas']['CartLineDto'];
export type Coupon = components['schemas']['CouponValidationDto'];

export async function getCart(): Promise<Cart> {
  const result = await getApiClient().GET('/api/v1/cart', { cache: 'no-store' });
  if (!result.data) throw new Error('Missing cart response');
  return result.data;
}

export async function addBook(bookId: number): Promise<void> {
  await getApiClient().POST('/api/v1/cart/items', {
    body: { bookId, bundleId: null, quantity: 1 },
  });
}

export async function updateQuantity(itemId: number, quantity: number): Promise<void> {
  await getApiClient().PUT('/api/v1/cart/items/{itemId}', {
    params: { path: { itemId } },
    body: { quantity },
  });
}

export async function removeItem(itemId: number): Promise<void> {
  await getApiClient().DELETE('/api/v1/cart/items/{itemId}', { params: { path: { itemId } } });
}

export async function clearCart(): Promise<void> {
  await getApiClient().DELETE('/api/v1/cart');
}

export async function validateCoupon(code: string): Promise<Coupon> {
  const result = await getApiClient().POST('/api/v1/coupons/validate', { body: { code } });
  if (!result.data) throw new Error('Missing coupon response');
  return result.data;
}
