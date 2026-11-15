import type { Metadata } from 'next';

import {
  CatalogView,
  getCatalogData,
  parseCatalogParams,
  type RawSearchParams,
} from '@/modules/catalog';
import { SearchTabs } from '@/modules/search';
import { buildBooksCatalogMetadata } from '@/modules/seo-site';

type BooksPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export async function generateMetadata({ searchParams }: BooksPageProps = {}): Promise<Metadata> {
  const rawParams = searchParams ? await searchParams : {};
  return buildBooksCatalogMetadata(rawParams);
}

// Public Book Catalog (/books). SiteShell owns the only <main>, so CatalogView renders directly inside it.
export default async function BooksPage({ searchParams }: BooksPageProps = {}) {
  const params = parseCatalogParams(searchParams ? await searchParams : {});
  const data = await getCatalogData(params);

  return (
    <>
      {params.q ? <SearchTabs /> : null}
      <CatalogView data={data} params={params} />
    </>
  );
}
