import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import {
  CatalogView,
  getCatalogData,
  parseCatalogParams,
  type RawSearchParams,
} from '@/modules/catalog';

export const metadata: Metadata = {
  title: messages.catalog.page.meta.title,
  description: messages.catalog.page.meta.description,
};

type BooksPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

// Public Book Catalog (/books). SiteShell owns the only <main>, so CatalogView renders directly inside it.
export default async function BooksPage({ searchParams }: BooksPageProps = {}) {
  const params = parseCatalogParams(searchParams ? await searchParams : {});
  const data = await getCatalogData(params);

  return <CatalogView data={data} params={params} />;
}
