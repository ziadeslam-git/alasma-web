import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { buildBookBreadcrumbJsonLd, buildBookJsonLd, buildBookMetadata } from '@/modules/books-seo';
import { getBook, normalizeBookSlug } from '@/modules/catalog';
import { BookDetailsView } from '@/modules/catalog/components/book-details-view';
import { JsonLd } from '@/shared/seo';
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

async function resolveBook(params: BookPageProps['params']) {
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

  return { slug, book: result.book };
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { book } = await resolveBook(params);
  return buildBookMetadata(book);
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug, book } = await resolveBook(params);

  return (
    <>
      <JsonLd data={buildBookJsonLd(book)} />
      <JsonLd data={buildBookBreadcrumbJsonLd(book)} />
      <BookDetailsView book={book}>
        <Suspense fallback={<Skeleton shape="card" />}>
          <RelatedBooks slug={slug} />
        </Suspense>
      </BookDetailsView>
    </>
  );
}
