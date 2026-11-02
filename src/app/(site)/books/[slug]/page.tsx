import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getBook, normalizeBookSlug } from '@/modules/catalog';
import { BookDetailsView } from '@/modules/catalog/components/book-details-view';
import { Skeleton } from '@/shared/ui/skeleton';

import { RelatedBooks } from './related-books';

export const revalidate = 600;

// Generate slugs on demand and allow ISR without a pre-built list.
export async function generateStaticParams() {
  return [];
}

type BookPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  let rawSlug: string | undefined;
  try {
    const resolved = await params;
    rawSlug = resolved.slug;
  } catch {
    notFound();
  }

  const slug = normalizeBookSlug(rawSlug);
  if (!slug) {
    notFound();
  }

  try {
    const result = await getBook(slug);
    if (result.kind === 'notFound') {
      notFound();
    }

    const { book } = result;
    return {
      title: book.title,
      description: book.description ? book.description.trim().slice(0, 160) : undefined,
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.startsWith('NEXT_NOT_FOUND')
    ) {
      throw error;
    }
    return {};
  }
}

export default async function BookPage({ params }: BookPageProps) {
  let rawSlug: string | undefined;
  try {
    const resolved = await params;
    rawSlug = resolved.slug;
  } catch {
    notFound();
  }

  const slug = normalizeBookSlug(rawSlug);
  if (!slug) {
    notFound();
  }

  const result = await getBook(slug);
  if (result.kind === 'notFound') {
    notFound();
  }

  return (
    <BookDetailsView book={result.book}>
      <Suspense fallback={<Skeleton shape="card" />}>
        <RelatedBooks slug={slug} />
      </Suspense>
    </BookDetailsView>
  );
}
