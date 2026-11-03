import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type CheckoutPreview = components['schemas']['CheckoutPreviewDto'];
export type PreviewRequest = components['schemas']['PreviewCheckoutRequest'];

export async function previewCheckout(body: PreviewRequest): Promise<CheckoutPreview> {
  const result = await getApiClient().POST('/api/v1/checkout/preview', { body, cache: 'no-store' });
  if (!result.data) throw new Error('Missing checkout preview response');
  return result.data;
}
