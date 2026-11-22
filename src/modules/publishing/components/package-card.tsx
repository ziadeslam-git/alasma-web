import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';

import type { PublishPackage } from '../api/publishing-api';
import { PackageCta } from './package-cta';
import styles from './publishing.module.css';

// One package of the design (.pk): flag for the highlighted one, duration, price, feature list and the request button.
// The price is what the API sends (or its note when the price is null); nothing is computed.
export function PackageCard({ item }: { item: PublishPackage }) {
  const hasBadge = Boolean(item.badge);
  return (
    <article className={hasBadge ? `${styles.card} ${styles.cardHot}` : styles.card}>
      {item.badge ? <span className={styles.flag}>{item.badge}</span> : null}
      <div>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <span className={styles.duration}>{item.durationText}</span>
      </div>
      <div className={styles.price}>
        {item.price !== null ? (
          <>
            <b>{formatNumber(item.price)}</b>
            <span className={styles.currency}>{messages.catalog.currency}</span>
          </>
        ) : item.priceNote ? (
          <span className={styles.priceNote}>{item.priceNote}</span>
        ) : null}
      </div>
      {item.features.length > 0 ? (
        <ul className={styles.features}>
          {item.features.map((feature, index) => (
            <li key={`${feature}-${index}`}>
              <Icon name="check-c" size="sm" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <PackageCta
        id={item.id}
        isPrimary={hasBadge}
        label={item.ctaText || messages.publishing.form.submit}
      />
    </article>
  );
}
