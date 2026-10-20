import { describe, expect, it } from 'vitest';

import { createServerClient } from './server-client';

// Type-level checks: tsc (pnpm typecheck) fails when a @ts-expect-error line stops being an error, so these lines
// prove that the generated paths reject a wrong query parameter name or value.
function typeChecks() {
  const api = createServerClient({ origin: 'http://localhost' });

  void api.GET('/api/v1/books', {
    params: { query: { q: 'novel', category: 'x', minPrice: 5, inStock: true } },
  });
  // @ts-expect-error categoryId is not a parameter of GET /books (the API calls it category)
  void api.GET('/api/v1/books', { params: { query: { categoryId: 5 } } });
  // @ts-expect-error sort accepts only the listed values
  void api.GET('/api/v1/books', { params: { query: { sort: 'popular' } } });
  // @ts-expect-error GET /books/{slug} needs its slug path parameter
  void api.GET('/api/v1/books/{slug}', {});
  // @ts-expect-error this path does not exist in the contract
  void api.GET('/api/v1/not-a-route', {});
}

describe('typed calls', () => {
  it('are checked at compile time (see typeChecks)', () => {
    expect(typeof typeChecks).toBe('function');
  });
});
