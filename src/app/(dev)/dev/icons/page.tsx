import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { iconRegistry, type IconName } from '@/shared/icons/icon-registry';
import { Icon, type IconSize } from '@/shared/ui/icon';

import styles from './icons.module.css';

export const metadata: Metadata = {
  title: 'Icons (dev)',
  robots: { index: false, follow: false },
};

const sizes: IconSize[] = ['sm', 'md', 'lg'];
const colours = ['primary', 'accent', 'danger'] as const;
const iconNames = Object.keys(iconRegistry) as IconName[];

// Development reference page: it exposes the generated registry without publishing it in production.
export default function IconsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const text = messages.devIcons;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{text.title}</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>{text.sizes}</h2>
        <div className={styles.sizeRow}>
          {sizes.map((size) => (
            <div key={size} className={styles.sizeSample}>
              <Icon label={text.sampleLabel} name="search" size={size} />
              <span>{text.sizeNames[size]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{text.colourInheritance}</h2>
        <div className={styles.colourRow}>
          {colours.map((colour) => (
            <span
              key={colour}
              className={styles.colourSample}
              style={{ color: `var(--${colour})` }}
            >
              <Icon name="heart" />
              {text.colourNames[colour]}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{text.allIcons}</h2>
        <div className={styles.grid}>
          {iconNames.map((name) => (
            <div key={name} className={styles.iconCard}>
              <Icon name={name} />
              <span className={styles.name}>{name}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
