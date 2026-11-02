import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import {
  CatalogView,
  CategoryNav,
  emptyCatalogParams,
  type CatalogData,
  type RawSearchParams,
} from '@/modules/catalog';

import { catalogFixtures } from '../catalog/catalog-fixtures';
import { filterFixtures } from '../catalog-filters/filter-fixtures';

export const metadata: Metadata = {
  title: 'Category (dev)',
  robots: { index: false, follow: false },
};

export default async function DevCategoryPage({
  searchParams,
}: { searchParams?: Promise<RawSearchParams> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const params = searchParams ? await searchParams : {};
  const state = typeof params.state === 'string' ? params.state : 'ok';
  const isEmpty = state === 'empty';
  const name =
    state === 'long'
      ? Array(5).fill(messages.devCatalogFilters.fixtures.fiction).join(' ')
      : messages.devCatalogFilters.fixtures.fiction;
  const data: CatalogData = {
    books: {
      status: isEmpty ? 'empty' : 'ok',
      items: isEmpty ? [] : catalogFixtures,
      page: 1,
      pageSize: 12,
      totalCount: isEmpty ? 0 : catalogFixtures.length,
      totalPages: isEmpty ? 0 : 1,
    },
    options: filterFixtures,
  };
  return (
    <main id="main-content">
      {state !== 'leaf' ? (
        <CategoryNav categories={filterFixtures.categories} detailRoutes />
      ) : null}
      <CatalogView
        basePath="/dev/category"
        data={data}
        heading={name}
        hideCategory
        params={emptyCatalogParams}
      />
    </main>
  );
}
