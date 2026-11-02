import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { getCategory } from './get-category';

const origin = 'http://127.0.0.1:5198';
const url = `${origin}/api/v1/categories/:slug`;
const sample = {
  id: 1,
  name: 'Category',
  slug: 'fiction',
  imageUrl: null,
  children: [],
  breadcrumb: [],
};

describe('getCategory', () => {
  it('returns the API category', async () => {
    server.use(http.get(url, () => HttpResponse.json(sample)));
    expect(await getCategory('fiction', { origin })).toEqual({ kind: 'ok', category: sample });
  });
  it.each([400, 404])('maps %s to notFound', async (status) => {
    server.use(http.get(url, () => new HttpResponse(null, { status })));
    expect(await getCategory(`missing-${status}`, { origin })).toEqual({ kind: 'notFound' });
  });
  it('throws for server failures', async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));
    await expect(getCategory('broken', { origin })).rejects.toThrow();
  });
  it('throws for network failures', async () => {
    server.use(http.get(url, () => HttpResponse.error()));
    await expect(getCategory('network', { origin })).rejects.toThrow();
  });
});
