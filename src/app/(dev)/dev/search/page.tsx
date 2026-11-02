import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { SearchOverlay, SearchTabs } from '@/modules/search';

export const metadata: Metadata = {
  title: 'Search (dev)',
  robots: { index: false, follow: false },
};

export default function SearchDevPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main id="main-content">
      <h1>{messages.search.title}</h1>
      <section>
        <h2>{messages.search.idle}</h2>
        <SearchOverlay previewLabel={`${messages.site.search.label} - ${messages.search.idle}`} />
      </section>
      <section>
        <h2>{messages.search.loading}</h2>
        <SearchOverlay
          initialState="loading"
          previewLabel={`${messages.site.search.label} - ${messages.search.loading}`}
        />
      </section>
      <section>
        <h2>{messages.search.books}</h2>
        <SearchOverlay
          initialState="results"
          previewLabel={`${messages.site.search.label} - ${messages.search.books}`}
          initialSuggestions={[
            {
              title: messages.devCatalog.fixtures.plainTitle,
              slug: 'sample-book',
              coverImageUrl: null,
            },
          ]}
        />
      </section>
      <section>
        <h2>{messages.search.empty}</h2>
        <SearchOverlay
          initialState="empty"
          previewLabel={`${messages.site.search.label} - ${messages.search.empty}`}
        />
      </section>
      <section>
        <h2>{messages.search.error}</h2>
        <SearchOverlay
          initialState="error"
          previewLabel={`${messages.site.search.label} - ${messages.search.error}`}
        />
      </section>
      <SearchTabs />
    </main>
  );
}
