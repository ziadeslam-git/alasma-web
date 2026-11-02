import messages from '@/i18n/messages/ar.json';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './search-tabs.module.css';

export function SearchTabs() {
  const text = messages.search;
  return (
    <nav aria-label={text.title} className={styles.tabs}>
      <span aria-current="page">{text.books}</span>
      <FeatureGate badge="inline" feature="search-tab-authors" label={messages.site.soon}>
        <span>{text.authors}</span>
      </FeatureGate>
      <FeatureGate badge="inline" feature="search-tab-events" label={messages.site.soon}>
        <span>{text.events}</span>
      </FeatureGate>
    </nav>
  );
}
