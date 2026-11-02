import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from './proxy';

describe('proxy segment guard', () => {
  it.each([
    '/books/a%2Fb',
    '/books/a%5Cb',
    '/authors/%00',
    '/categories/%E0%A4%A',
    '/pages/About',
    `/books/${'a'.repeat(351)}`,
  ])('rejects an invalid segment at %s', (path) => {
    const response = proxy(new NextRequest(`http://localhost${path}`));
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost/invalid-segment');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex');
  });

  it('passes valid and unrelated paths through', () => {
    for (const path of [
      '/books/valid',
      `/books/${'a'.repeat(350)}`,
      `/books/${encodeURIComponent('\u0643\u062a\u0627\u0628')}`,
      '/authors/valid',
      '/categories/valid',
      '/pages/about',
      '/books',
      '/api/other',
      '/other/value',
    ]) {
      expect(
        proxy(new NextRequest(`http://localhost${path}`)).headers.get('x-middleware-next'),
      ).toBe('1');
    }
    expect(config.matcher).toEqual([
      '/books/:slug',
      '/authors/:slug',
      '/categories/:slug',
      '/pages/:key',
    ]);
  });
});
