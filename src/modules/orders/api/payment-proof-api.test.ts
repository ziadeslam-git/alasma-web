import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';
import { buildOrder, orderFixtureId } from '@/test/fixtures/orders';

const clients = vi.hoisted(() => ({ used: [] as string[] }));

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  const make = (name: string) => () => {
    clients.used.push(name);
    return createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' });
  };
  return { getApiClient: make('default'), getUploadApiClient: make('upload') };
});
import { buildPaymentProofForm, submitPaymentProof } from './payment-proof-api';

const url = `http://localhost/api/v1/orders/${orderFixtureId}/payment-proof`;
const png = () => new File(['png-bytes'], 'receipt.png', { type: 'image/png' });

function problem(status: number, code?: string, headers: Record<string, string> = {}) {
  return HttpResponse.json(
    { status, title: 'Problem', ...(code ? { code } : {}) },
    { status, headers: { 'Content-Type': 'application/problem+json', ...headers } },
  );
}

describe('submitPaymentProof', () => {
  beforeEach(() => {
    clients.used.length = 0;
  });

  it('builds the multipart fields of the contract and never an amount', () => {
    const form = buildPaymentProofForm({
      file: png(),
      transactionReference: ' REF-1 ',
      senderPhone: '01012345678',
    });

    expect([...form.keys()].sort()).toEqual(['screenshot', 'senderPhone', 'transactionReference']);
    expect(form.get('transactionReference')).toBe('REF-1');
    expect(form.get('senderPhone')).toBe('01012345678');
    expect((form.get('screenshot') as File).name).toBe('receipt.png');
  });

  it('leaves out blank optional fields', () => {
    const form = buildPaymentProofForm({
      file: png(),
      transactionReference: '  ',
      senderPhone: '',
    });

    expect([...form.keys()]).toEqual(['screenshot']);
  });

  it('posts multipart with the bearer token on the upload client and returns the order', async () => {
    const updated = buildOrder({ status: 'PaymentReview' });
    let contentType = '';
    let authorization = '';
    server.use(
      http.post(url, async ({ request }) => {
        contentType = request.headers.get('content-type') ?? '';
        authorization = request.headers.get('authorization') ?? '';
        return HttpResponse.json(updated);
      }),
    );

    const result = await submitPaymentProof(orderFixtureId, {
      file: png(),
      transactionReference: 'REF-1',
    });

    expect(result.status).toBe('PaymentReview');
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(authorization).toBe('Bearer token');
    expect(clients.used).toEqual(['upload']);
  });

  it('works against the default test handler', async () => {
    const result = await submitPaymentProof(orderFixtureId, { file: png() });

    expect(result.status).toBe('PaymentReview');
    expect(result.payments[0]?.status).toBe('Submitted');
  });

  it.each([
    [400, 'payment_proof_file_invalid'],
    [404, 'order_not_found'],
    [409, 'payment_reference_taken'],
    [413, undefined],
    [422, 'payment_proof_not_allowed'],
    [422, 'payment_proof_order_expired'],
    [422, 'payment_proof_already_submitted'],
  ] as const)('turns HTTP %i %s into an ApiError', async (status, code) => {
    server.use(http.post(url, () => problem(status, code)));

    const error = await submitPaymentProof(orderFixtureId, { file: png() }).catch(
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    expect((error as ApiError).code).toBe(code);
  });

  it('exposes Retry-After on a 429', async () => {
    server.use(http.post(url, () => problem(429, undefined, { 'Retry-After': '7' })));

    const error = await submitPaymentProof(orderFixtureId, { file: png() }).catch(
      (cause: unknown) => cause,
    );

    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).retryAfterSeconds).toBe(7);
  });
});
