import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoriesView } from '@/modules/catalog';
import { filterFixtures } from '../catalog-filters/filter-fixtures';

export const metadata: Metadata = {
  title: 'Categories (dev)',
  robots: { index: false, follow: false },
};

export default async function DevCategoriesPage({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const categories =
    state === 'empty'
      ? []
      : filterFixtures.categories.map((item) => ({
          ...item,
          imageUrl: state === 'no-images' ? null : '/logo-alasma.svg',
          name: state === 'long' ? Array(5).fill(item.name).join(' ') : item.name,
        }));
  return (
    <main id="main-content">
      <CategoriesView categories={categories} />
    </main>
  );
}
