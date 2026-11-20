import { getRelatedBooks, RelatedBooksSection } from '@/modules/catalog';

export async function RelatedBooks({ slug }: { slug: string }) {
  const books = await getRelatedBooks(slug);

  if (books.length === 0) {
    return null;
  }

  return <RelatedBooksSection books={books} />;
}
