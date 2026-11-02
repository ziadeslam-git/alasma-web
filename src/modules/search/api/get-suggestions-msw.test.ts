import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { getSuggestions } from './get-suggestions';

const endpoint = `${window.location.origin}/api/v1/search/suggest`;

describe('suggestions API', () => {
  it('returns suggestions from the API', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([{ title: 'Book', slug: 'book', coverImageUrl: null }]),
      ),
    );
    await expect(getSuggestions('book', new AbortController().signal)).resolves.toEqual([
      { title: 'Book', slug: 'book', coverImageUrl: null },
    ]);
  });
  it.each([400, 404, 500])('throws for HTTP %s', async (status) => {
    server.use(http.get(endpoint, () => HttpResponse.json({ title: 'Error', status }, { status })));
    await expect(getSuggestions('book', new AbortController().signal)).rejects.toThrow();
  });
  it('throws on a network error', async () => {
    server.use(http.get(endpoint, () => HttpResponse.error()));
    await expect(getSuggestions('book', new AbortController().signal)).rejects.toThrow();
  });
});
