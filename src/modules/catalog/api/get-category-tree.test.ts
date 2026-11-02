import { expect, it } from 'vitest';
import { getCategoryTree } from './get-category-tree';

it('loads categories and returns a neutral empty state for errors', async () => {
  const data = [{ id: 1, name: 'Category', slug: 'one', imageUrl: null, children: [] }];
  expect(await getCategoryTree({ fetch: async () => Response.json(data) })).toEqual(data);
  expect(
    await getCategoryTree({ fetch: async () => new Response(null, { status: 500 }) }),
  ).toBeNull();
  expect(
    await getCategoryTree({
      fetch: async () => {
        throw new Error('network');
      },
    }),
  ).toBeNull();
});
