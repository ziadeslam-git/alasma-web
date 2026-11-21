import { getApiClient } from '@/modules/auth';

// The printable receipt is a full HTML page behind the Bearer token, so it is fetched as text by the client.
export async function getPaymentReceiptHtml(orderId: string, paymentId: string): Promise<string> {
  const result = await getApiClient().GET('/api/v1/orders/{id}/payments/{paymentId}/receipt', {
    cache: 'no-store',
    params: { path: { id: orderId, paymentId } },
    parseAs: 'text',
  });
  if (!result.data) throw new Error('Missing receipt');

  return result.data;
}
