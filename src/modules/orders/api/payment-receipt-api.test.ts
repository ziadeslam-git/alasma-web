import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';
import { orderFixtureId, paymentFixtureId } from '@/test/fixtures/orders';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});
import { getPaymentReceiptHtml } from './payment-receipt-api';

const url = `http://localhost/api/v1/orders/${orderFixtureId}/payments/${paymentFixtureId}/receipt`;
const page = '<!doctype html><html dir="rtl"><body>receipt</body></html>';

describe('getPaymentReceiptHtml', () => {
  it('reads the HTML page as text with the bearer token', async () => {
    let authorization = '';
    server.use(
      http.get(url, ({ request }) => {
        authorization = request.headers.get('authorization') ?? '';
        return new HttpResponse(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }),
    );

    expect(await getPaymentReceiptHtml(orderFixtureId, paymentFixtureId)).toBe(page);
    expect(authorization).toBe('Bearer token');
  });

  it('reads the page from the default test handler', async () => {
    expect(await getPaymentReceiptHtml(orderFixtureId, paymentFixtureId)).toContain('dir="rtl"');
  });

  it.each([
    [422, 'payment_receipt_not_available'],
    [404, 'payment_not_found'],
    [404, 'order_not_found'],
    [404, undefined],
  ] as const)('turns HTTP %i %s into an ApiError', async (status, code) => {
    server.use(
      http.get(url, () =>
        HttpResponse.json(
          { status, title: 'Problem', ...(code ? { code } : {}) },
          { status, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );

    const error = await getPaymentReceiptHtml(orderFixtureId, paymentFixtureId).catch(
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    expect((error as ApiError).code).toBe(code);
  });
});
