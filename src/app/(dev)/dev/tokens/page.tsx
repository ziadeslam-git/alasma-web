import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';

import { readTokenGroups } from './read-tokens';
import styles from './tokens.module.css';

export const metadata: Metadata = {
  title: 'Design tokens (dev)',
  robots: { index: false, follow: false },
};

const faces = [
  { variable: '--font-display', label: 'Aref Ruqaa (display)', weights: [400, 700] },
  {
    variable: '--font-sans',
    label: 'IBM Plex Sans Arabic (sans)',
    weights: [300, 400, 500, 600, 700],
  },
  { variable: '--font-reading', label: 'Amiri (reading)', weights: [400, 700] },
];

const latinSample = 'The quick brown fox jumps over the lazy dog';

// Development reference page: the owner compares it with the design canvas. It does not exist in production.
export default function TokensPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const tokens = readTokenGroups();
  const text = messages.devTokens;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Design tokens</h1>

      <section className={styles.section}>
        <h2 className={styles.title}>Colours</h2>
        <div className={styles.grid}>
          {tokens.colours.map((name) => (
            <div key={name} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(--${name})` }} />
              <span className={styles.name}>--{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Spacing</h2>
        {tokens.spacing.map((name) => (
          <div key={name} className={styles.row}>
            <span className={styles.name}>--{name}</span>
            <div className={styles.bar} style={{ inlineSize: `var(--${name})` }} />
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Radii</h2>
        <div className={styles.row}>
          {tokens.radii.map((name) => (
            <div key={name} className={styles.swatch}>
              <div className={styles.box} style={{ borderRadius: `var(--${name})` }} />
              <span className={styles.name}>--{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Shadows</h2>
        <div className={styles.row}>
          {tokens.shadows.map((name) => (
            <div key={name} className={styles.swatch}>
              <div className={styles.shadow} style={{ boxShadow: `var(--${name})` }} />
              <span className={styles.name}>--{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Fonts and weights</h2>
        {faces.map((face) => (
          <div key={face.variable} className={styles.section}>
            <span className={styles.meta}>
              {face.label} {face.variable}
            </span>
            {face.weights.map((weight) => (
              <div
                key={weight}
                className={styles.sample}
                style={{ fontFamily: `var(${face.variable})`, fontWeight: weight }}
              >
                <span className={styles.meta}>{weight}</span>
                <span>{text.sampleSentence}</span>
                <span>
                  {latinSample} {text.sampleNumbers} {text.samplePrice}
                </span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Text classes</h2>
        {tokens.textClasses.map((name) => (
          <div key={name} className={styles.sample}>
            <span className={styles.meta}>.{name}</span>
            <span className={name}>
              {name.startsWith('quote') ? text.sampleQuote : text.sampleSentence}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
