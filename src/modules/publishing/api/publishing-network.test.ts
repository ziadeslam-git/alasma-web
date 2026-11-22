import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { ApiError } from '@/shared/lib/api';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  const client = () =>
    createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' });
  return { getApiClient: client, getUploadApiClient: client };
});
import { getManuscriptTypes, getPackages, submitPackageRequest } from './publishing-api';

const base = 'http://localhost/api/v1';

describe('publishing API: network failure', () => {
  it('turns a dropped connection on the packages read into an error result', async () => {
    server.use(http.get(`${base}/packages`, () => HttpResponse.error()));

    await expect(getPackages({ origin: 'http://localhost' })).resolves.toEqual({ status: 'error' });
  });

  it.each([
    ['manuscript types', () => getManuscriptTypes()],
    [
      'request upload',
      () =>
        submitPackageRequest({
          packageId: 1,
          authorName: 'Name',
          phone: '01012345678',
          workTitle: 'Title',
          manuscriptTypeId: 1,
          synopsis: 'Synopsis',
          notes: '',
          file: new File(['x'], 'book.pdf', { type: 'application/pdf' }),
        }),
    ],
  ])('rejects %s with an ApiError of kind network', async (_name, call) => {
    server.use(
      http.get(`${base}/manuscript-types`, () => HttpResponse.error()),
      http.post(`${base}/package-requests`, () => HttpResponse.error()),
    );

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
