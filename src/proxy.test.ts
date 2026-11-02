import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from './proxy';

describe('proxy segment guard', () => {
  it.each(['/books/a%2Fb', '/authors/%00', '/categories/%E0%A4%A', '/pages/About'])(
    'rejects an invalid segment at %s',
    (path) => {
      const response = proxy(new NextRequest(`http://localhost${path}`));
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-robots-tag')).toBe('noindex');
    },
  );

  it('passes valid and unrelated paths through', () => {
    for (const path of ['/books/valid', '/books', '/api/other', '/other/value']) {
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
