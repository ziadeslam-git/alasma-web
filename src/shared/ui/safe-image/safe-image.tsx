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
    // Called once when the image fails to load, so a parent can swap in a designed fallback.
    onError?: () => void;
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
  onError,
  priority = false,
  src,
  width,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const isPlaceholder = !src || hasError;
  const wrapperClassName = [styles.wrapper, className].filter(Boolean).join(' ');
  // A fixed-size image (without an aspect ratio, which already reserves its box) that fails to load (or has no source) keeps the box it reserved: a placeholder shorter than the
  // image made the layout jump when the error came (CLS 0.41 on /authors, Task 80).
  const placeholderSize =
    !fill && !aspectRatio && width && height ? { blockSize: height, inlineSize: width } : null;
  const style = aspectRatio ? { aspectRatio } : undefined;

  if (isPlaceholder) {
    return (
      <span
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : alt}
        className={`${wrapperClassName} ${styles.placeholder}`}
        role={decorative ? undefined : 'img'}
        style={placeholderSize ? { ...style, ...placeholderSize } : style}
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
        onError={() => {
          setHasError(true);
          onError?.();
        }}
        priority={priority}
        src={src ?? ''}
        style={!fill && width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
        width={width}
      />
    </span>
  );
}
