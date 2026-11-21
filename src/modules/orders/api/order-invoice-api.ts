import { getApiClient } from '@/modules/auth';

// The printable invoice is a full HTML page behind the Bearer token, so it is fetched as text by the client.
export async function getOrderInvoiceHtml(orderId: string): Promise<string> {
  const result = await getApiClient().GET('/api/v1/orders/{id}/invoice', {
    cache: 'no-store',
    params: { path: { id: orderId } },
    parseAs: 'text',
  });
  if (!result.data) throw new Error('Missing invoice');

  return result.data;
}
