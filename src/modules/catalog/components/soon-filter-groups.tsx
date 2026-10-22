import messages from '@/i18n/messages/ar.json';
import type { FeatureKey } from '@/shared/config/features';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './soon-filter-groups.module.css';

type SoonGroup = { feature: FeatureKey; title: string };

const text = messages.catalog.filters;

// Groups the design shows but the API cannot filter by yet. Each one is dimmed and inert through its own feature key
// and shows no options (no invented languages, formats or ratings).
const soonGroups: readonly SoonGroup[] = [
  { feature: 'filter-language', title: text.groups.language },
  { feature: 'filter-cover-type', title: text.groups.coverType },
  { feature: 'filter-rating', title: text.groups.rating },
];

export function SoonFilterGroups() {
  const soonLabel = messages.site.soon;

  return (
    <>
      {soonGroups.map((group) => (
        <FeatureGate feature={group.feature} key={group.feature} label={soonLabel}>
          <div className={styles.group}>
            <h3 className={styles.title}>{group.title}</h3>
          </div>
        </FeatureGate>
      ))}
      <FeatureGate feature="filter-facet-counts" label={soonLabel}>
        <p className={styles.note}>{text.facetCountsNote}</p>
      </FeatureGate>
    </>
  );
}
