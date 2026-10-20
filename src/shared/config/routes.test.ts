import { describe, expect, it } from 'vitest';

import { authorRoute, bookRoute, categoryRoute, routes, staticPageRoute } from './routes';

describe('routes', () => {
  it('exposes the V1 static routes', () => {
    expect(routes).toMatchObject({
      account: '/account',
      books: '/books',
      cart: '/cart',
      home: '/',
      login: '/login',
      register: '/register',
      publish: '/publish',
    });
  });

  it('encodes Arabic dynamic path segments', () => {
    const arabicBookSlug = '\u0643\u062a\u0627\u0628 \u0639\u0631\u0628\u064a';
    const arabicAuthorSlug = '\u0645\u0624\u0644\u0641';
    const arabicCategorySlug = '\u0623\u062f\u0628';

    expect(bookRoute(arabicBookSlug)).toBe(`/books/${encodeURIComponent(arabicBookSlug)}`);
    expect(authorRoute(arabicAuthorSlug)).toBe(`/authors/${encodeURIComponent(arabicAuthorSlug)}`);
    expect(categoryRoute(arabicCategorySlug)).toBe(
      `/categories/${encodeURIComponent(arabicCategorySlug)}`,
    );
    expect(staticPageRoute('privacy policy')).toBe('/pages/privacy%20policy');
  });
});
