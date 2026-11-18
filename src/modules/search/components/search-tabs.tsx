'use client';

import messages from '@/i18n/messages/ar.json';
import { useIsFeatureLive } from '@/shared/config/feature-flags';

import styles from './search-tabs.module.css';

// The search results tabs. "Books" is the only real one: authors and events are hidden until their features are live,
// and while neither is live a lone "books" tab says nothing, so the whole row is left out (Task 76).
export function SearchTabs() {
  const text = messages.search;
  const hasAuthorsTab = useIsFeatureLive('search-tab-authors');
  const hasEventsTab = useIsFeatureLive('search-tab-events');

  if (!hasAuthorsTab && !hasEventsTab) return null;

  return (
    <nav aria-label={text.title} className={styles.tabs}>
      <span aria-current="page">{text.books}</span>
      {hasAuthorsTab ? <span>{text.authors}</span> : null}
      {hasEventsTab ? <span>{text.events}</span> : null}
    </nav>
  );
}
