'use client';

import Image from 'next/image';
import { useState } from 'react';

import styles from './safe-image.module.css';

type AccessibleImage = {
  alt: string;
  decorative?: false;
};

type DecorativeImage = {
  alt?: '';
  decorative: true;
};

type FixedImageDimensions = {
  aspectRatio?: string;
  fill?: false;
  height: number;
  width: number;
};

type FillImageDimensions = {
  aspectRatio: string;
  fill: true;
  height?: never;
  width?: never;
};

export type SafeImageProps = (AccessibleImage | DecorativeImage) &
  (FixedImageDimensions | FillImageDimensions) & {
    className?: string;
    priority?: boolean;
    src?: string | null;
  };

export function SafeImage({
  alt,
  aspectRatio,
  className,
  decorative = false,
  fill = false,
  height,
  priority = false,
  src,
  width,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const isPlaceholder = !src || hasError;
  const wrapperClassName = [styles.wrapper, className].filter(Boolean).join(' ');
  const style = aspectRatio ? { aspectRatio } : undefined;

  if (isPlaceholder) {
    return (
      <span
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : alt}
        className={`${wrapperClassName} ${styles.placeholder}`}
        role={decorative ? undefined : 'img'}
        style={style}
      />
    );
  }

  return (
    <span className={wrapperClassName} style={style}>
      <Image
        alt={alt ?? ''}
        aria-hidden={decorative || undefined}
        fill={fill}
        height={height}
        onError={() => setHasError(true)}
        priority={priority}
        src={src ?? ''}
        width={width}
      />
    </span>
  );
}
