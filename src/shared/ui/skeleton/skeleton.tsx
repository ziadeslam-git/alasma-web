import styles from './skeleton.module.css';

export type SkeletonShape = 'line' | 'block' | 'circle' | 'card';
export type SkeletonSize = 'sm' | 'md' | 'lg';

export type SkeletonProps = {
  className?: string;
  reducedMotion?: boolean;
  shape?: SkeletonShape;
  size?: SkeletonSize;
};

const sizeClasses: Record<SkeletonSize, string> = {
  sm: styles.sizeSmall ?? '',
  md: styles.sizeMedium ?? '',
  lg: styles.sizeLarge ?? '',
};

export function Skeleton({
  className,
  reducedMotion = false,
  shape = 'line',
  size = 'md',
}: SkeletonProps) {
  const containerClassName = [
    styles.skeleton,
    sizeClasses[size],
    reducedMotion ? styles.reducedMotion : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (shape === 'card') {
    return (
      <div aria-busy="true" className={`${containerClassName} ${styles.card}`}>
        <span aria-hidden="true" className={`${styles.shape} ${styles.cardImage}`} />
        <span aria-hidden="true" className={`${styles.shape} ${styles.cardTitle}`} />
        <span aria-hidden="true" className={`${styles.shape} ${styles.cardText}`} />
      </div>
    );
  }

  return (
    <span
      aria-busy="true"
      aria-hidden="true"
      className={`${containerClassName} ${styles.shape} ${styles[shape] ?? ''}`}
    />
  );
}
