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
import { Children, type ReactElement, type ReactNode } from 'react';
import messages from '@/i18n/messages/ar.json';
import { CatalogIntro } from '@/modules/catalog';
import { JsonLd } from '@/shared/seo';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
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
    mocks.catalog.mockResolvedValue({
      books: { status: 'ok', items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
    });
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

  // Task 79: the breadcrumb and the sub-category chips are both <nav> landmarks; sharing one label made axe report
  // landmark-unique as soon as a category had children. The breadcrumb takes the breadcrumb label, and the page also
  // carries a BreadcrumbList JSON-LD block.
  it('labels the breadcrumb with its own landmark name and adds a BreadcrumbList JSON-LD', async () => {
    mocks.category.mockResolvedValue({
      kind: 'ok',
      category: {
        id: 1,
        name: 'Child',
        slug: 'child',
        children: [{ id: 2, name: 'Grandchild', slug: 'grandchild', bookCount: 1, children: [] }],
        breadcrumb: [{ id: 9, name: 'Parent', slug: 'parent' }],
      },
    });
    mocks.catalog.mockResolvedValue({
      books: { status: 'ok', items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
    });

    const ui = await CategoryPage({ params: Promise.resolve({ slug: 'child' }) });
    const top = Children.toArray(
      (ui as ReactElement<{ children: ReactNode }>).props.children,
    ) as ReactElement<{
      children?: ReactNode;
      label?: string;
      data?: { '@type'?: string; itemListElement?: { position: number; name: string }[] };
    }>[];

    const intro = top.find((node) => node.type === CatalogIntro)!;
    const crumbs = Children.toArray(intro.props.children).find(
      (node) => (node as ReactElement).type === Breadcrumbs,
    ) as ReactElement<{ label: string }>;
    expect(crumbs.props.label).toBe(messages.catalog.detail.breadcrumbsLabel);
    expect(crumbs.props.label).not.toBe(messages.catalog.filters.categoryNav.label);

    const jsonLd = top.find((node) => node.type === JsonLd)!;
    expect(jsonLd.props.data?.['@type']).toBe('BreadcrumbList');
    expect(jsonLd.props.data?.itemListElement?.map((entry) => entry.name)).toEqual([
      messages.site.header.home,
      'Parent',
      'Child',
    ]);
  });
});
