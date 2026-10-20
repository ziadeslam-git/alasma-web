import messages from '@/i18n/messages/ar.json';
import { SafeImage } from '@/shared/ui/safe-image';

import styles from '../components.module.css';

export function SafeImageSection() {
  const text = messages.devComponents.safeImage;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.subheading}>{text.withSource}</h3>
          <SafeImage
            alt={text.imageAlt}
            aspectRatio="2 / 3"
            src="/book-cover.jpg"
            width={400}
            height={600}
          />
        </div>
        <div className={styles.card}>
          <h3 className={styles.subheading}>{text.missingSource}</h3>
          <SafeImage alt={text.imageAlt} aspectRatio="2 / 3" fill />
        </div>
      </div>
    </section>
  );
}
