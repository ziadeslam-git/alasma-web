import { expect, it } from 'vitest';
import { getCategoryTree } from './get-category-tree';

const data = [{ id: 1, name: 'Category', slug: 'one', imageUrl: null, children: [] }];

it('loads categories', async () => {
  expect(await getCategoryTree({ fetch: async () => Response.json(data) })).toEqual({
    status: 'ok',
    categories: data,
  });
});

// Task 67: a failed load is 'error' (shown with a retry), never an empty list
it('reports a 5xx and a network failure as an error, not as an empty list', async () => {
  expect(await getCategoryTree({ fetch: async () => new Response(null, { status: 500 }) })).toEqual(
    { status: 'error' },
  );
  expect(
    await getCategoryTree({
      fetch: async () => {
        throw new Error('network');
      },
    }),
  ).toEqual({ status: 'error' });
});

it('keeps an empty 200 as ok with an empty list', async () => {
  expect(await getCategoryTree({ fetch: async () => Response.json([]) })).toEqual({
    status: 'ok',
    categories: [],
  });
});
