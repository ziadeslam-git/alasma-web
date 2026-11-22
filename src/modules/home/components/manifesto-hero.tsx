import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { FeatureGate } from '@/shared/ui/soon';

import styles from './manifesto-hero.module.css';
import { QUILL_PATH } from './quill-path';

const WAVE_PATH =
  'M0 50C200 90 400 90 600 50S1000 10 1200 50 1600 90 1800 50 2200 10 2400 50V90H0z';

// Static brand manifesto hero (the single page h1, subline, live store CTA, and Soon publish CTA).
export function ManifestoHero() {
  const text = messages.home.manifesto;
  const soonLabel = messages.site.soon;

  return (
    <section aria-label={text.ariaLabel} className={styles.hero}>
      <span aria-hidden="true" className={`${styles.orb} ${styles.orbOne}`} />
      <span aria-hidden="true" className={`${styles.orb} ${styles.orbTwo}`} />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{text.eyebrow}</span>
          <h1 className={styles.headline}>
            <span className={styles.word}>{text.wordOne}</span>
            <span aria-hidden="true" className={styles.dot}>
              ·
            </span>
            <span className={styles.word}>{text.wordTwo}</span>
            <span aria-hidden="true" className={styles.dot}>
              ·
            </span>
            <span className={`${styles.word} ${styles.wordAccent}`}>{text.wordThree}</span>
          </h1>
          <p className={styles.description}>{text.description}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryCta} href={routes.books}>
              <span>{text.browseCta}</span>
              <Icon name="arrow" size="sm" />
            </Link>
            <FeatureGate feature="publish-packages" label={soonLabel} whenSoon="hide">
              <Link className={styles.secondaryCta} href={routes.publish}>
                {text.publishCta}
              </Link>
            </FeatureGate>
          </div>
        </div>

        <div aria-hidden="true" className={styles.art}>
          <div className={styles.featherWrap}>
            <svg
              className={styles.quill}
              fill="none"
              shapeRendering="geometricPrecision"
              viewBox="40 150 620 410"
            >
              <path className={styles.quillPath} d={QUILL_PATH} fillRule="evenodd" />
            </svg>
            <span className={styles.inkDrop} />
            <span className={styles.ripple} />
            <span className={`${styles.ripple} ${styles.rippleSecond}`} />
          </div>
        </div>
      </div>

      <svg
        aria-hidden="true"
        className={styles.wave}
        preserveAspectRatio="none"
        viewBox="0 0 2400 90"
      >
        <path className={styles.wavePath} d={WAVE_PATH} />
      </svg>
    </section>
  );
}
