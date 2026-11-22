import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';
import { orderFixtureId, paymentFixtureId } from '@/test/fixtures/orders';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  const client = () =>
    createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' });
  return { getApiClient: client, getUploadApiClient: client };
});
import { getOrderInvoiceHtml } from './order-invoice-api';
import { submitPaymentProof } from './payment-proof-api';
import { getPaymentReceiptHtml } from './payment-receipt-api';

const base = `http://localhost/api/v1/orders/${orderFixtureId}`;

// A dropped connection must reach the caller as an ApiError of kind "network", never as a raw TypeError.
describe('order documents and payment proof: network failure', () => {
  it.each([
    ['invoice', () => getOrderInvoiceHtml(orderFixtureId)],
    ['receipt', () => getPaymentReceiptHtml(orderFixtureId, paymentFixtureId)],
    [
      'payment proof',
      () =>
        submitPaymentProof(orderFixtureId, {
          file: new File(['x'], 'receipt.png', { type: 'image/png' }),
        }),
    ],
  ])('rejects the %s call with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.get(`${base}/invoice`, () => HttpResponse.error()),
      http.get(`${base}/payments/${paymentFixtureId}/receipt`, () => HttpResponse.error()),
      http.post(`${base}/payment-proof`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
