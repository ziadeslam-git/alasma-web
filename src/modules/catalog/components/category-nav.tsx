import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { categoryRoute, routes } from '@/shared/config/routes';

import type { CategoryNode } from '../types';
import styles from './category-nav.module.css';

export type CategoryNavProps = {
  // The tree of GET /categories.
  categories: readonly CategoryNode[];
  activeSlug?: string | undefined;
};

const matches = (node: CategoryNode, slug: string | undefined) =>
  slug !== undefined && (node.slug === slug || String(node.id) === slug);

const containsActive = (node: CategoryNode, slug: string | undefined): boolean =>
  matches(node, slug) || node.children.some((child) => containsActive(child, slug));

type ChipLinkProps = { current: 'page' | 'true' | undefined; href: string; label: string };

function ChipLink({ current, href, label }: ChipLinkProps) {
  return (
    <li>
      <Link aria-current={current} className={styles.chip} href={href}>
        {label}
      </Link>
    </li>
  );
}

// Category chips as real links to the category route (/categories/[slug]), the same pages the roadmap builds in F1.15b.
// "All" goes to /books. The exact active category has aria-current="page"; its top-level parent has "true" and its
// sub-categories show in a second row. No categories: nothing is rendered.
export function CategoryNav({ activeSlug, categories }: CategoryNavProps) {
  if (categories.length === 0) {
    return null;
  }

  const text = messages.catalog.filters.categoryNav;
  const activeRoot = categories.find((node) => containsActive(node, activeSlug));
  const isAll = activeSlug === undefined;

  return (
    <nav aria-label={text.label} className={styles.nav}>
      <ul className={styles.list}>
        <ChipLink current={isAll ? 'page' : undefined} href={routes.books} label={text.all} />
        {categories.map((node) => (
          <ChipLink
            current={matches(node, activeSlug) ? 'page' : activeRoot === node ? 'true' : undefined}
            href={categoryRoute(node.slug)}
            key={node.id}
            label={node.name}
          />
        ))}
      </ul>
      {activeRoot && activeRoot.children.length > 0 ? (
        <ul aria-label={text.subLabel} className={styles.list}>
          {activeRoot.children.map((node) => (
            <ChipLink
              current={matches(node, activeSlug) ? 'page' : undefined}
              href={categoryRoute(node.slug)}
              key={node.id}
              label={node.name}
            />
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
