import messages from '@/i18n/messages/ar.json';
import { Skeleton, type SkeletonShape, type SkeletonSize } from '@/shared/ui/skeleton';

import styles from '../components.module.css';

const shapes: SkeletonShape[] = ['line', 'block', 'circle', 'card'];
const sizes: SkeletonSize[] = ['sm', 'md', 'lg'];

export function SkeletonSection() {
  const text = messages.devComponents.skeleton;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{text.heading}</h2>
      <div className={styles.grid}>
        {shapes.map((shape) => (
          <div key={shape} className={styles.card}>
            <h3 className={styles.subheading}>{text.shapes[shape]}</h3>
            <div className={styles.row}>
              {sizes.map((size) => (
                <Skeleton key={size} shape={shape} size={size} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
