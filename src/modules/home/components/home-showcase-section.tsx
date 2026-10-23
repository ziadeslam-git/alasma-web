import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { BookCover } from '@/shared/ui/book-cover';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './home-showcase-section.module.css';

// Matches the ".hero" grid on Main.dc.html: Book of the Month (home-book-of-month, Soon), Author Event card
// (home-events, Soon), and New Releases store CTA card (live link to /books?sort=newest).
export function HomeShowcaseSection() {
  const text = messages.home.showcase;
  const soonLabel = messages.site.soon;

  return (
    <section aria-label={text.ariaLabel} className={styles.section}>
      <div className={styles.grid}>
        <FeatureGate feature="home-book-of-month" label={soonLabel}>
          <div className={styles.mainCard}>
            <div className={styles.mainText}>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>{text.bookOfMonthBadge}</span>
              </div>
              <h2 className={styles.mainTitle}>{text.bookOfMonthTitle}</h2>
              <p className={styles.mainDescription}>{text.bookOfMonthDescription}</p>
              <div className={styles.mainActions}>
                <span className={styles.primaryAction}>
                  <span>{text.orderNow}</span>
                  <Icon name="arrow" size="sm" />
                </span>
                <span className={styles.outlineAction}>
                  <Icon name="heart" size="sm" />
                  <span>{text.addToWishlist}</span>
                </span>
              </div>
            </div>
            <div aria-hidden="true" className={styles.mainVisual}>
              <BookCover
                as="div"
                className={styles.cover}
                title={text.bookOfMonthBadge}
                variantKey="book-of-month"
              />
            </div>
          </div>
        </FeatureGate>

        <div className={styles.side}>
          <FeatureGate feature="home-events" label={soonLabel}>
            <div className={styles.eventCard}>
              <h2 className={styles.sideTitle}>{text.eventTitle}</h2>
              <p className={styles.eventDescription}>{text.eventDescription}</p>
              <span className={styles.eventAction}>{text.eventAction}</span>
            </div>
          </FeatureGate>

          <Link className={styles.releasesCard} href={routes.books}>
            <div className={styles.releasesCopy}>
              <h2 className={styles.sideTitle}>{text.newReleasesTitle}</h2>
              <span className={styles.releasesSubtitle}>{text.newReleasesSubtitle}</span>
            </div>
            <span aria-hidden="true" className={styles.releasesIcon}>
              <Icon name="arrow" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
