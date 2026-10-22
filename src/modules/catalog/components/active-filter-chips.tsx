import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/icon';

import {
  buildCatalogHref,
  clearFilters,
  countActiveFilters,
  withoutFilter,
  type CatalogFilterKey,
} from '../url/catalog-href';
import type { CatalogParams } from '../url/catalog-params';
import { buildSelectOptions, findOptionLabel } from '../url/select-options';
import type { FilterOptions } from '../types';
import styles from './active-filter-chips.module.css';

export type ActiveFilterChipsProps = {
  basePath: string;
  options: FilterOptions;
  params: CatalogParams;
};

type Chip = { key: CatalogFilterKey; label: string };

function priceLabel(params: CatalogParams): string | undefined {
  const text = messages.catalog.filters.chips;
  const { minPrice, maxPrice } = params;

  if (minPrice !== undefined && maxPrice !== undefined) {
    return text.priceBetween
      .replace('{min}', formatNumber(minPrice))
      .replace('{max}', formatNumber(maxPrice));
  }
  if (minPrice !== undefined) return text.priceFrom.replace('{min}', formatNumber(minPrice));
  if (maxPrice !== undefined) return text.priceTo.replace('{max}', formatNumber(maxPrice));

  return undefined;
}

function buildChips(params: CatalogParams, options: FilterOptions): Chip[] {
  const text = messages.catalog.filters.chips;
  const select = buildSelectOptions(options);
  const price = priceLabel(params);
  const chips: Chip[] = [];

  if (params.q) chips.push({ key: 'q', label: text.query.replace('{q}', params.q) });
  if (params.category)
    chips.push({ key: 'category', label: findOptionLabel(select.categories, params.category) });
  if (params.author)
    chips.push({ key: 'author', label: findOptionLabel(select.authors, params.author) });
  if (params.publisher)
    chips.push({ key: 'publisher', label: findOptionLabel(select.publishers, params.publisher) });
  if (price) chips.push({ key: 'price', label: price });
  if (params.inStock) chips.push({ key: 'inStock', label: text.inStock });
  if (params.hasDiscount) chips.push({ key: 'hasDiscount', label: text.hasDiscount });

  return chips;
}

// One real link per active filter that removes it, plus "clear all". Links (not buttons) so it works before hydration,
// can be opened in a new tab, and needs no client code. Labels come from the option lists, never from raw slugs.
export function ActiveFilterChips({ basePath, options, params }: ActiveFilterChipsProps) {
  const text = messages.catalog.filters;
  const chips = buildChips(params, options);

  if (chips.length === 0) {
    return null;
  }

  return (
    <section aria-label={text.chips.label} className={styles.wrapper}>
      <ul className={styles.list}>
        {chips.map((chip) => (
          <li className={styles.chip} key={chip.key}>
            <span>{chip.label}</span>
            <Link
              aria-label={text.chips.remove.replace('{label}', chip.label)}
              className={styles.remove}
              href={buildCatalogHref(basePath, withoutFilter(params, chip.key))}
              replace
              scroll={false}
            >
              <Icon name="x" size="sm" />
            </Link>
          </li>
        ))}
      </ul>
      {countActiveFilters(params) > 0 ? (
        <Link
          className={styles.clearAll}
          href={buildCatalogHref(basePath, clearFilters(params))}
          replace
          scroll={false}
        >
          {text.clearAll}
        </Link>
      ) : null}
    </section>
  );
}
