import { AuthorsView, getAuthors } from '@/modules/authors';
import { parseCatalogParams } from '@/modules/catalog';
export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page } = parseCatalogParams(await searchParams);
  return <AuthorsView page={page} data={await getAuthors(page)} />;
}
