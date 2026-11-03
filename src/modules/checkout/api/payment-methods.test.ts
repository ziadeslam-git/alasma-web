import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { getPaymentMethods } from './payment-methods';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

const url = 'http://localhost/api/v1/payment-methods';

describe('payment methods', () => {
  it('normalizes the omitted cash details and preserves transfer details', async () => {
    const transfer = {
      method: 'ManualTransfer',
      details: {
        transferNumbers: [{ channel: 'InstaPay', number: '0111 111 1111' }],
        instructions: null,
        expiresInHours: 48,
      },
    };
    server.use(http.get(url, () => HttpResponse.json([{ method: 'CashOnDelivery' }, transfer])));
    await expect(getPaymentMethods()).resolves.toEqual([
      { method: 'CashOnDelivery', details: null },
      transfer,
    ]);
  });
  it.each([401, 403, 429])('propagates status %i', async (status) => {
    server.use(http.get(url, () => HttpResponse.json({ code: 'payment_error' }, { status })));
    await expect(getPaymentMethods()).rejects.toMatchObject({ status });
  });
  it('propagates a network failure', async () => {
    server.use(http.get(url, () => HttpResponse.error()));
    await expect(getPaymentMethods()).rejects.toMatchObject({ kind: 'network' });
  });
});
