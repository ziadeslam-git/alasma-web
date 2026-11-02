import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AuthorView, getAuthor, getAuthorBooks } from '@/modules/authors';
import { BookGrid, normalizeSlug } from '@/modules/catalog';
import { Skeleton } from '@/shared/ui/skeleton';

// The database column is 200 characters even though the backend validator allows 350.
export const MAX_AUTHOR_SLUG_LENGTH = 200;
export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}
type Props = { params: Promise<{ slug: string }> };
async function resolveAuthor(params: Props['params']) {
  let raw: string;
  try {
    raw = (await params).slug;
  } catch {
    notFound();
  }
  const slug = normalizeSlug(raw, MAX_AUTHOR_SLUG_LENGTH);
  if (!slug) notFound();
  const author = await getAuthor(slug);
  if (!author) notFound();
  return author;
}
export async function generateMetadata({ params }: Props) {
  const author = await resolveAuthor(params);
  return { title: author.name };
}
async function Books({ slug }: { slug: string }) {
  return <BookGrid items={await getAuthorBooks(slug)} />;
}
export default async function AuthorPage({ params }: Props) {
  const author = await resolveAuthor(params);
  return (
    <AuthorView author={author}>
      <Suspense fallback={<Skeleton shape="card" />}>
        <Books slug={author.slug} />
      </Suspense>
    </AuthorView>
  );
}
