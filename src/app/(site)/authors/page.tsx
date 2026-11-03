import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { AuthorsView, getAuthors } from '@/modules/authors';
import { parseCatalogParams, type RawSearchParams } from '@/modules/catalog';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

type AuthorsPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export async function generateMetadata({ searchParams }: AuthorsPageProps = {}): Promise<Metadata> {
  const rawParams = searchParams ? await searchParams : {};
  const { page } = parseCatalogParams(rawParams);
  const path = page > 1 ? `${routes.authors}?page=${page}` : routes.authors;

  return buildPageMetadata({
    title: messages.seo.authorsTitle,
    description: messages.seo.authorsDescription,
    path,
  });
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps = {}) {
  const { page } = parseCatalogParams(searchParams ? await searchParams : {});
  return <AuthorsView page={page} data={await getAuthors(page)} />;
}
