import messages from '@/i18n/messages/ar.json';
import { features, type FeatureKey, type FeatureState } from '@/shared/config/features';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Soon } from '@/shared/ui/soon';

import styles from '../components.module.css';

const featureEntries = Object.entries(features) as [FeatureKey, FeatureState][];

export function SoonSection() {
  const text = messages.devComponents.soon;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <Soon feature="wishlist-heart" label={text.badge}>
            <Button>{text.button}</Button>
          </Soon>
        </div>
        <div className={styles.card}>
          <Soon feature="filter-rating" label={text.badge}>
            <Input aria-label={text.inputLabel} placeholder={text.inputPlaceholder} />
          </Soon>
        </div>
        <div className={styles.card}>
          <Soon feature="sort-popular" label={text.badge}>
            <select
              aria-label={text.sortLabel}
              className={styles.soonSelect}
              defaultValue="popular"
            >
              <option value="popular">{text.sortOption}</option>
            </select>
          </Soon>
        </div>
        <div className={styles.card}>
          <Soon feature="home-editor-pick" label={text.badge}>
            <article className={styles.soonBlock}>
              <h3 className={styles.subheading}>{text.cardTitle}</h3>
              <p>{text.cardDescription}</p>
            </article>
          </Soon>
        </div>
        <div className={styles.card}>
          <Soon badge="inline" feature="book-short-link" label={text.badge}>
            <span className={styles.linkLike}>{text.link}</span>
          </Soon>
        </div>
      </div>
      <table className={styles.featureTable}>
        <thead>
          <tr>
            <th scope="col">{text.tableFeature}</th>
            <th scope="col">{text.tableState}</th>
          </tr>
        </thead>
        <tbody>
          {featureEntries.map(([feature, state]) => (
            <tr key={feature}>
              <td>{feature}</td>
              <td>{text.states[state]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
