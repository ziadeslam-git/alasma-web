import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import type { BookCardItem } from '@/modules/catalog';
import { routes, bookRoute } from '@/shared/config/routes';
import { formatMoney } from '@/shared/lib/format';
import { BookCover } from '@/shared/ui/book-cover';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './home-soon-sections.module.css';

// The design highlights the middle slot of the five.
const HIGHLIGHT_INDEX = 2;
const TRENDING_SLOTS = 5;
const TEAM_PICK_SLOTS = [1, 2, 3] as const;

// All non-delivered Main.dc.html sections. Each is hidden (not dimmed) while its feature is soon, and the gate wraps the
// whole <section>, so a hidden one leaves no empty wrapper behind (that was the blank band, Task 76). No fake book data and
// no live links: Editor's Pick (.spot), Trending/Most Popular (.band/.trend), Team Picks (.picks).
// (The campaign placeholders that are not in the design were removed; their features stay registered as soon.)
export function HomeSoonSections({
  bestSellers: allBestSellers,
}: {
  bestSellers: readonly BookCardItem[];
}) {
  // The band has five slots.
  const bestSellers = allBestSellers.slice(0, TRENDING_SLOTS);
  const soonLabel = messages.site.soon;
  const spotlight = messages.home.spotlight;
  const trending = messages.home.trending;
  const teamPicks = messages.home.teamPicks;

  return (
    <>
      <FeatureGate feature="home-editor-pick" label={soonLabel} whenSoon="hide">
        <section aria-labelledby="home-spotlight-heading" className={styles.wrapSection}>
          <div className={styles.spot}>
            <div className={styles.spotText}>
              <span className={styles.spotEyebrow}>{spotlight.eyebrow}</span>
              <h2 className={styles.spotHeading} id="home-spotlight-heading">
                {spotlight.heading}
              </h2>
              <p className={styles.spotDescription}>{spotlight.description}</p>
              <span className={styles.spotAction}>
                <span>{spotlight.cta}</span>
                <Icon name="arrow" size="sm" />
              </span>
            </div>
            <div aria-hidden="true" className={styles.spotVisual}>
              <p className={styles.spotQuote}>{spotlight.quote}</p>
            </div>
          </div>
        </section>
      </FeatureGate>

      {bestSellers.length > 0 ? (
        <FeatureGate feature="home-most-popular" label={soonLabel} whenSoon="hide">
          <section aria-labelledby="home-trending-heading" className={styles.band}>
            <div className={styles.bandWrap}>
              <div className={styles.trend}>
                <h2 className={styles.trendHeading} id="home-trending-heading">
                  {trending.heading}
                </h2>
                <div className={styles.trendRow}>
                  {bestSellers.map((book, index) => {
                    const isHighlight = index === HIGHLIGHT_INDEX;
                    const authors = book.authors.join(messages.catalog.authorSeparator);
                    return (
                      <Link
                        className={isHighlight ? styles.trendHighlight : styles.trendItem}
                        href={bookRoute(book.slug)}
                        key={book.id}
                      >
                        <div className={styles.trendItemHeader}>
                          <h3 className={styles.trendItemTitle}>{book.title}</h3>
                          {authors ? (
                            <span
                              className={
                                isHighlight
                                  ? styles.trendHighlightSubtitle
                                  : styles.trendItemSubtitle
                              }
                            >
                              {authors}
                            </span>
                          ) : null}
                        </div>
                        <div className={isHighlight ? styles.trendHighlightBox : styles.trendBox}>
                          <BookCover
                            as="div"
                            className={styles.trendCover}
                            imageUrl={book.coverImageUrl}
                            title={book.title}
                            variantKey={book.slug}
                          />
                        </div>
                        {isHighlight ? (
                          <b className={styles.trendPrice}>{formatMoney(book.finalPrice)}</b>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
                <div className={styles.trendFooter}>
                  <Link className={styles.trendCta} href={routes.bestsellers}>
                    <span className={styles.trendCtaText}>{trending.viewAll}</span>
                    <span className={styles.trendCtaIcon}>
                      <Icon name="arrow" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </FeatureGate>
      ) : null}

      <FeatureGate feature="home-team-picks" label={soonLabel} whenSoon="hide">
        <section aria-labelledby="home-team-picks-heading" className={styles.wrapSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionHeading} id="home-team-picks-heading">
                {teamPicks.heading}
              </h2>
              <p className={styles.sectionSubtitle}>{teamPicks.subtitle}</p>
            </div>
          </div>
          <div className={styles.picksGrid}>
            {TEAM_PICK_SLOTS.map((slot) => (
              <div className={styles.pickCard} key={slot}>
                <BookCover
                  as="div"
                  className={styles.pickCover}
                  title={teamPicks.heading}
                  variantKey={`pick-${String(slot)}`}
                />
                <div className={styles.pickBody}>
                  <h3 className={styles.pickTitle}>{teamPicks.placeholderTitle}</h3>
                  <p className={styles.pickQuote}>{teamPicks.placeholderQuote}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FeatureGate>
    </>
  );
}
