import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';

import type { CategoryNode } from '../types';
import { buildCatalogHref, withFilter } from '../url/catalog-href';
import { emptyCatalogParams, type CatalogParams } from '../url/catalog-params';
import styles from './category-nav.module.css';

export type CategoryNavProps = {
  // The tree of GET /categories.
  categories: readonly CategoryNode[];
  activeSlug?: string | undefined;
  basePath?: string;
  params?: CatalogParams;
};

const matches = (node: CategoryNode, slug: string | undefined) =>
  slug !== undefined && (node.slug === slug || String(node.id) === slug);

const containsActive = (node: CategoryNode, slug: string | undefined): boolean =>
  matches(node, slug) || node.children.some((child) => containsActive(child, slug));

type ChipLinkProps = {
  current: 'page' | 'true' | undefined;
  href: string;
  label: string;
};

function ChipLink({ current, href, label }: ChipLinkProps) {
  return (
    <li>
      <Link aria-current={current} className={styles.chip} href={href}>
        {label}
      </Link>
    </li>
  );
}

// These chips filter the catalog; standalone category detail pages remain separately gated.
export function CategoryNav({
  activeSlug,
  basePath = routes.books,
  categories,
  params = emptyCatalogParams,
}: CategoryNavProps) {
  if (categories.length === 0) {
    return null;
  }

  const text = messages.catalog.filters.categoryNav;
  const activeRoot = categories.find((node) => containsActive(node, activeSlug));
  const isAll = activeSlug === undefined;

  return (
    <nav aria-label={text.label} className={styles.nav}>
      <ul className={styles.list}>
        <ChipLink
          current={isAll ? 'page' : undefined}
          href={buildCatalogHref(basePath, withFilter(params, { category: undefined }))}
          label={text.all}
        />
        {categories.map((node) => (
          <ChipLink
            current={matches(node, activeSlug) ? 'page' : activeRoot === node ? 'true' : undefined}
            href={buildCatalogHref(basePath, withFilter(params, { category: node.slug }))}
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
              href={buildCatalogHref(basePath, withFilter(params, { category: node.slug }))}
              key={node.id}
              label={node.name}
            />
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
