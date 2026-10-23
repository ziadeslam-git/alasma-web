import messages from '@/i18n/messages/ar.json';
import { BookCover } from '@/shared/ui/book-cover';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './home-soon-sections.module.css';

const TRENDING_SLOTS = [1, 2, 3, 4, 5] as const;
const TEAM_PICK_SLOTS = [1, 2, 3] as const;

// All non-delivered Main.dc.html sections, rendered dimmed and inert through FeatureGate with zero fake book data and
// zero live links: Editor's Pick (.spot), Trending/Most Popular (.band/.trend), Team Picks (.picks), plus the
// remaining home campaign features (home-banners, home-quotes, home-newsletter).
export function HomeSoonSections() {
  const soonLabel = messages.site.soon;
  const spotlight = messages.home.spotlight;
  const trending = messages.home.trending;
  const teamPicks = messages.home.teamPicks;
  const campaigns = messages.home.campaigns;

  return (
    <>
      <section aria-labelledby="home-spotlight-heading" className={styles.wrapSection}>
        <FeatureGate feature="home-editor-pick" label={soonLabel}>
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
        </FeatureGate>
      </section>

      <section aria-labelledby="home-trending-heading" className={styles.band}>
        <div className={styles.bandWrap}>
          <FeatureGate feature="home-most-popular" label={soonLabel}>
            <div className={styles.trend}>
              <h2 className={styles.trendHeading} id="home-trending-heading">
                {trending.heading}
              </h2>
              <div aria-hidden="true" className={styles.trendControls}>
                <span className={styles.squareButton}>
                  <Icon name="arrow-r" size="sm" />
                </span>
                <span className={`${styles.squareButton} ${styles.squareButtonFilled}`}>
                  <Icon name="arrow" size="sm" />
                </span>
              </div>
              <div className={styles.trendRow}>
                {TRENDING_SLOTS.map((slot) => {
                  const isHighlight = slot === 3;
                  return (
                    <div
                      className={isHighlight ? styles.trendHighlight : styles.trendItem}
                      key={slot}
                    >
                      <div className={styles.trendItemHeader}>
                        <h3 className={styles.trendItemTitle}>{trending.placeholderTitle}</h3>
                        <span
                          className={
                            isHighlight ? styles.trendHighlightSubtitle : styles.trendItemSubtitle
                          }
                        >
                          {trending.placeholderSubtitle}
                        </span>
                      </div>
                      <div className={isHighlight ? styles.trendHighlightBox : styles.trendBox}>
                        <BookCover
                          as="div"
                          className={styles.trendCover}
                          title={trending.heading}
                          variantKey={`trend-${String(slot)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.trendFooter}>
                <span className={styles.trendCta}>
                  <span className={styles.trendCtaText}>{trending.viewAll}</span>
                  <span className={styles.trendCtaIcon}>
                    <Icon name="arrow" />
                  </span>
                </span>
              </div>
            </div>
          </FeatureGate>
        </div>
      </section>

      <section aria-labelledby="home-team-picks-heading" className={styles.wrapSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionHeading} id="home-team-picks-heading">
              {teamPicks.heading}
            </h2>
            <p className={styles.sectionSubtitle}>{teamPicks.subtitle}</p>
          </div>
        </div>
        <FeatureGate feature="home-team-picks" label={soonLabel}>
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
        </FeatureGate>
      </section>

      <section aria-labelledby="home-campaigns-heading" className={styles.wrapSection}>
        <h2 className={styles.sectionHeading} id="home-campaigns-heading">
          {campaigns.heading}
        </h2>
        <div className={styles.campaignsGrid}>
          <FeatureGate feature="home-banners" label={soonLabel}>
            <div className={styles.campaignCard}>
              <h3 className={styles.campaignTitle}>{campaigns.bannersTitle}</h3>
              <p className={styles.campaignDescription}>{campaigns.bannersDescription}</p>
            </div>
          </FeatureGate>

          <FeatureGate feature="home-quotes" label={soonLabel}>
            <div className={styles.campaignCard}>
              <h3 className={styles.campaignTitle}>{campaigns.quoteTitle}</h3>
              <p className={styles.campaignDescription}>{campaigns.quoteDescription}</p>
            </div>
          </FeatureGate>

          <FeatureGate feature="home-newsletter" label={soonLabel}>
            <div className={styles.campaignCard}>
              <h3 className={styles.campaignTitle}>{campaigns.newsletterTitle}</h3>
              <p className={styles.campaignDescription}>{campaigns.newsletterDescription}</p>
              <div className={styles.newsletterRow}>
                <span className={styles.newsletterField}>{campaigns.newsletterPlaceholder}</span>
                <span className={styles.newsletterButton}>{campaigns.newsletterSubmit}</span>
              </div>
            </div>
          </FeatureGate>
        </div>
      </section>
    </>
  );
}
