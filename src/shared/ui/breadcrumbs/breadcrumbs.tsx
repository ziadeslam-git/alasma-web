import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import type { FeatureKey } from '@/shared/config/features';
import { Icon } from '@/shared/ui/icon';
import { FeatureLink } from '@/shared/ui/soon';

import styles from './breadcrumbs.module.css';

export type BreadcrumbItem = {
  href?: string;
  label: string;
  feature?: FeatureKey;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  label: string;
};

export type BreadcrumbListJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    item: string;
    name: string;
    position: number;
  }>;
};

export function Breadcrumbs({ items, label }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={styles.breadcrumbs}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {index > 0 ? <Icon className={styles.separator} name="arrow" size="sm" /> : null}
              {isCurrent || !item.href ? (
                <span aria-current={isCurrent ? 'page' : undefined} className={styles.current}>
                  {item.label}
                </span>
              ) : item.feature ? (
                <FeatureLink
                  className={styles.link}
                  feature={item.feature}
                  href={item.href}
                  label={messages.site.soon}
                >
                  {item.label}
                </FeatureLink>
              ) : (
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function buildBreadcrumbListJsonLd(
  items: BreadcrumbItem[],
  baseUrl: string,
): BreadcrumbListJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      item: item.href ? new URL(item.href, baseUrl).toString() : baseUrl,
      name: item.label,
      position: index + 1,
    })),
  };
}
