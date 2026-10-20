import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';

import { nextFetch } from './next-options';
import { createServerClient } from './server-client';
import { throwIfError } from './throw-if-error';

describe('server client', () => {
  it('calls the absolute origin with no credentials or authorization', async () => {
    let seen: Request | undefined;
    server.use(
      http.get('http://localhost/api/v1/ping', ({ request }) => {
        seen = request;

        return HttpResponse.json({ status: 'ok' });
      }),
    );
    const api = createServerClient({ origin: 'http://localhost/' });

    const result = await api.GET('/api/v1/ping', {
      ...nextFetch({ revalidate: 60, tags: ['ping'] }),
    });

    expect(result.data).toEqual({ status: 'ok' });
    expect(seen?.headers.get('Authorization')).toBeNull();
  });

  it('throws an ApiError from a failed result with throwIfError', async () => {
    server.use(
      http.get('http://localhost/api/v1/books/nope', () =>
        HttpResponse.json({ code: 'catalog_book_not_found' }, { status: 404 }),
      ),
    );
    const api = createServerClient({ origin: 'http://localhost' });

    const result = await api.GET('/api/v1/books/{slug}', { params: { path: { slug: 'nope' } } });

    let thrown: unknown;

    try {
      throwIfError(result);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ status: 404, code: 'catalog_book_not_found' });
  });
});
