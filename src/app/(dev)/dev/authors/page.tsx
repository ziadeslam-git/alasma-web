import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthorView, AuthorsView, type Author, type AuthorList } from '@/modules/authors';
import { BookGrid } from '@/modules/catalog';
import messages from '@/i18n/messages/ar.json';
export const metadata: Metadata = {
  title: 'Authors (dev)',
  robots: { index: false, follow: false },
};
export default async function DevAuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { state } = await searchParams;
  const author: Author = {
    id: 1,
    name: messages.site.header.authors,
    slug: 'sample',
    photoUrl: state === 'detail-photo' ? '/logo-alasma.svg' : null,
    shortBio: state === 'detail-photo' ? messages.home.categories.heading : null,
    fullBio: state === 'detail-photo' ? messages.home.categories.heading : null,
    socialLinks: null,
    books: [],
  };
  if (state === 'detail' || state === 'detail-photo')
    return (
      <main id="main-content">
        <AuthorView author={author}>
          <BookGrid
            items={
              state === 'detail-photo'
                ? [
                    {
                      id: 1,
                      title: messages.site.header.store,
                      slug: 'sample',
                      authors: [author.name],
                      coverImageUrl: null,
                      discountPercent: 0,
                      finalPrice: 100,
                      price: 100,
                      isFeatured: false,
                      isNew: false,
                      stockStatus: 'InStock',
                    },
                  ]
                : []
            }
          />
        </AuthorView>
      </main>
    );
  const data: AuthorList = {
    items: state === 'empty' ? [] : [author],
    page: 1,
    pageSize: 48,
    totalCount: state === 'empty' ? 0 : 1,
  };
  return (
    <main id="main-content">
      <AuthorsView data={data} page={1} />
    </main>
  );
}
