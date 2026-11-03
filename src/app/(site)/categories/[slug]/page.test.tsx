import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  category: vi.fn(),
  catalog: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/modules/catalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/catalog')>()),
  getCategory: mocks.category,
  getCatalogData: mocks.catalog,
}));

import CategoryPage, { generateMetadata } from './page';
import { getCategory } from '@/modules/catalog/api/get-category';

describe('category route', () => {
  beforeEach(() => vi.clearAllMocks());
  it('computes category metadata with canonical and Decision 20 robots rules', async () => {
    mocks.category.mockResolvedValue({
      kind: 'ok',
      category: {
        id: 1,
        name: 'الروايات',
        slug: 'novels',
        imageUrl: null,
        children: [],
        breadcrumb: [],
      },
    });
    const baseMeta = await generateMetadata({ params: Promise.resolve({ slug: 'novels' }) });
    expect(baseMeta.title).toBe('الروايات');
    expect(baseMeta.alternates?.canonical).toContain('/categories/novels');
    expect(baseMeta.robots).toEqual({ index: true, follow: true });

    const filteredMeta = await generateMetadata({
      params: Promise.resolve({ slug: 'novels' }),
      searchParams: Promise.resolve({ inStock: 'true' }),
    });
    expect(filteredMeta.alternates?.canonical).toContain('/categories/novels');
    expect(filteredMeta.robots).toEqual({ index: false, follow: true });
  });
  it('rejects an overlong slug before calling the API', async () => {
    await expect(
      CategoryPage({ params: Promise.resolve({ slug: 'a'.repeat(201) }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.category).not.toHaveBeenCalled();
  });
  it('calls notFound for missing categories', async () => {
    mocks.category.mockResolvedValue({ kind: 'notFound' });
    await expect(CategoryPage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it.each([400, 404])('calls notFound for a category API %i response', async (status) => {
    mocks.category.mockImplementation((slug: string) =>
      getCategory(slug, {
        fetch: async () => new Response(null, { status }),
      }),
    );
    await expect(
      CategoryPage({ params: Promise.resolve({ slug: `missing-${status}` }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('forces the path category when the query contains a different category', async () => {
    mocks.category.mockResolvedValue({
      kind: 'ok',
      category: { id: 1, name: 'Category', slug: 'one', children: [], breadcrumb: [] },
    });
    mocks.catalog.mockResolvedValue({});
    await CategoryPage({
      params: Promise.resolve({ slug: 'one' }),
      searchParams: Promise.resolve({ category: 'other' }),
    });
    expect(mocks.catalog).toHaveBeenCalledWith(expect.objectContaining({ category: 'one' }));
  });
  it('propagates server errors', async () => {
    mocks.category.mockRejectedValue(new Error('server'));
    await expect(CategoryPage({ params: Promise.resolve({ slug: 'failure' }) })).rejects.toThrow(
      'server',
    );
  });
});
