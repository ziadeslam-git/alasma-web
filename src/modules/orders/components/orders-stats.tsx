import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './orders-list.module.css';

// The stat cards of the design. Only the total is known (the list's totalCount, on the unfiltered view); the other three
// need counts the API does not send, so they are shown dimmed with a dash (soon), not with invented numbers.
export function OrdersStats({ total }: { total: number | null }) {
  const text = messages.orders;
  return (
    <section aria-label={text.statsLabel} className={styles.stats}>
      <div className={styles.stat}>
        <b>{total === null ? '—' : formatNumber(total)}</b>
        <span>{text.statsTotal}</span>
      </div>
      <div className={styles.statsRest}>
        <FeatureGate badge="inline" feature="orders-stats" label={messages.site.soon}>
          <div className={styles.statsInner}>
            {[text.statsAwaiting, text.statsShipping, text.statsDelivered].map((label) => (
              <div className={styles.stat} key={label}>
                <b>—</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </FeatureGate>
      </div>
    </section>
  );
}
