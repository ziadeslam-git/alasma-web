import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';

import { makeGroups } from '../test/fixtures';
import {
  buildPackageRequestForm,
  getManuscriptTypes,
  getPackages,
  submitPackageRequest,
} from './publishing-api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  const client = () =>
    createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' });
  return { getApiClient: client, getUploadApiClient: client };
});

const base = 'http://localhost/api/v1';
const problem = (status: number, code: string, headers: Record<string, string> = {}) =>
  HttpResponse.json(
    { code, status, title: 'x' },
    { headers: { 'Content-Type': 'application/problem+json', ...headers }, status },
  );
const input = () => ({
  packageId: 3,
  authorName: ' اسم ',
  phone: '01012345678',
  workTitle: 'عنوان',
  manuscriptTypeId: 2,
  synopsis: 'نبذة',
  notes: '  ',
  file: new File(['pdf'], 'book.pdf', { type: 'application/pdf' }),
});

describe('publishing API', () => {
  it('reads the packages on the server and turns a failure into an error result', async () => {
    server.use(http.get(`${base}/packages`, () => HttpResponse.json(makeGroups())));
    const ok = await getPackages({ origin: 'http://localhost' });
    expect(ok.status).toBe('ok');

    server.use(http.get(`${base}/packages`, () => problem(500, 'x')));
    await expect(getPackages({ origin: 'http://localhost' })).resolves.toEqual({ status: 'error' });
  });

  it('reads the manuscript types', async () => {
    server.use(
      http.get(`${base}/manuscript-types`, () =>
        HttpResponse.json([{ id: 1, name: 'نوع', order: 1 }]),
      ),
    );

    await expect(getManuscriptTypes()).resolves.toEqual([{ id: 1, name: 'نوع', order: 1 }]);
  });

  it('builds the multipart fields of the contract, trimmed, without the optional empty notes', () => {
    const form = buildPackageRequestForm(input());

    expect([...form.keys()].sort()).toEqual(
      [
        'authorName',
        'file',
        'manuscriptTypeId',
        'packageId',
        'phone',
        'synopsis',
        'workTitle',
      ].sort(),
    );
    expect(form.get('authorName')).toBe('اسم');
    expect(form.get('packageId')).toBe('3');
    expect(form.get('file')).toBeInstanceOf(File);
  });

  it('posts multipart form data without an Idempotency-Key and returns the created request', async () => {
    let contentType = '';
    let hasKey = true;
    server.use(
      http.post(`${base}/package-requests`, ({ request }) => {
        contentType = request.headers.get('content-type') ?? '';
        hasKey = request.headers.has('Idempotency-Key');
        return HttpResponse.json({ id: 5, status: 'New' }, { status: 201 });
      }),
    );

    const created = await submitPackageRequest(input());

    expect(contentType).toContain('multipart/form-data');
    expect(hasKey).toBe(false);
    expect(created.id).toBe(5);
  });

  it.each([
    [400, 'manuscript_file_invalid'],
    [422, 'package_not_available'],
    [422, 'manuscript_type_not_available'],
    [401, 'package_request_unauthenticated'],
  ])('turns %i %s into an ApiError with an Arabic message', async (status, code) => {
    server.use(http.post(`${base}/package-requests`, () => problem(status, code)));

    const error = await submitPackageRequest(input()).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
    expect(getApiErrorMessage(error as ApiError)).toMatch(/[؀-ۿ]/);
    expect(getApiErrorMessage(error as ApiError)).not.toBe(
      getApiErrorMessage(new ApiError({ kind: 'unknown' })),
    );
  });

  it('keeps Retry-After on a 429 and the status on 403 and 413', async () => {
    server.use(
      http.post(`${base}/package-requests`, () => problem(429, 'x', { 'Retry-After': '30' })),
    );
    const limited = (await submitPackageRequest(input()).catch((c: unknown) => c)) as ApiError;
    expect(limited.status).toBe(429);
    expect(limited.retryAfterSeconds).toBe(30);

    for (const status of [403, 413]) {
      server.use(http.post(`${base}/package-requests`, () => problem(status, 'x')));
      const error = (await submitPackageRequest(input()).catch((c: unknown) => c)) as ApiError;
      expect(error.status).toBe(status);
    }
  });
});
