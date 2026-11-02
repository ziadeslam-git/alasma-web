import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { getAuthor, getAuthors, getAuthorBooks } from './authors';
const origin = 'http://localhost:5198';
const author = {
  id: 1,
  name: 'Author',
  slug: 'one',
  photoUrl: null,
  shortBio: null,
  fullBio: null,
  socialLinks: null,
  books: [],
};
describe('authors API', () => {
  it('loads list and uses a capped page size', async () => {
    server.use(
      http.get(`${origin}/api/v1/authors`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('pageSize')).toBe('48');
        return HttpResponse.json({ items: [author], page: 1, pageSize: 48, totalCount: 1 });
      }),
    );
    expect((await getAuthors(1, { origin }))?.items).toHaveLength(1);
  });
  it('returns the author', async () => {
    server.use(http.get(`${origin}/api/v1/authors/:slug`, () => HttpResponse.json(author)));
    expect(await getAuthor('one', { origin })).toEqual(author);
  });
  for (const status of [400, 404])
    it(`returns null for ${status}`, async () => {
      server.use(
        http.get(`${origin}/api/v1/authors/:slug`, () => new HttpResponse(null, { status })),
      );
      expect(await getAuthor(`missing-${status}`, { origin })).toBeNull();
    });
  it('throws a server failure for an author', async () => {
    server.use(
      http.get(`${origin}/api/v1/authors/:slug`, () => new HttpResponse(null, { status: 500 })),
    );
    await expect(getAuthor('error', { origin })).rejects.toBeDefined();
  });
  it('throws a network failure for an author', async () => {
    server.use(http.get(`${origin}/api/v1/authors/:slug`, () => HttpResponse.error()));
    await expect(getAuthor('network', { origin })).rejects.toBeDefined();
  });
  it('shows empty list on failure', async () => {
    server.use(http.get(`${origin}/api/v1/authors`, () => new HttpResponse(null, { status: 500 })));
    expect(await getAuthors(1, { origin })).toBeNull();
  });
  it('returns author books from the books search', async () => {
    server.use(
      http.get(`${origin}/api/v1/books`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('author')).toBe('one');
        return HttpResponse.json({ items: [], page: 1, pageSize: 12, totalCount: 0 });
      }),
    );
    expect(await getAuthorBooks('one', { origin })).toEqual([]);
  });
});
