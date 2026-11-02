import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { getPage } from './get-page';

const origin = 'http://localhost:5198';
const endpoint = `${origin}/api/v1/pages/:key`;

describe('getPage', () => {
  it('returns the public page', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json({ key: 'about', title: 'Title', body: 'Body' })),
    );
    expect(await getPage('about', { origin })).toEqual({
      kind: 'ok',
      page: { key: 'about', title: 'Title', body: 'Body' },
    });
  });
  it.each([400, 404])('maps %s to not found', async (status) => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status })));
    expect(await getPage(`test-${status}`, { origin })).toEqual({ kind: 'notFound' });
  });
  it('throws on server errors', async () => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status: 500 })));
    await expect(getPage('error', { origin })).rejects.toThrow();
  });
  it('throws on network errors', async () => {
    server.use(http.get(endpoint, () => HttpResponse.error()));
    await expect(getPage('network', { origin })).rejects.toThrow();
  });
});
