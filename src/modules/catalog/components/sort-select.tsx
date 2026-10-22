'use client';

import { useId } from 'react';

import messages from '@/i18n/messages/ar.json';
import { getFeatureState, type FeatureKey } from '@/shared/config/features';

import { useCatalogNavigation } from '../hooks/use-catalog-navigation';
import { withSort } from '../url/catalog-href';
import { CATALOG_SORTS, type CatalogParams, type CatalogSort } from '../url/catalog-params';
import styles from './sort-select.module.css';

export type SortSelectProps = {
  basePath: string;
  params: CatalogParams;
};

type SortChoice = { label: string; value: string; feature?: FeatureKey };

const text = messages.catalog.filters.sort;

// The order of the design's select. Supported sorts are selectable; the others are options gated by their feature key,
// disabled and followed by the "soon" text (a native option cannot hold the Soon badge, and a disabled option keeps the
// select fully keyboard and screen reader accessible).
const choices: readonly SortChoice[] = [
  { value: 'popular', label: text.popular, feature: 'sort-popular' },
  { value: 'newest', label: text.newest },
  { value: 'best_selling', label: text.bestSelling, feature: 'sort-best-selling' },
  { value: 'price_asc', label: text.priceAsc },
  { value: 'price_desc', label: text.priceDesc },
  { value: 'top_rated', label: text.topRated, feature: 'sort-top-rated' },
  { value: 'title', label: text.title },
];

const isCatalogSort = (value: string): value is CatalogSort =>
  CATALOG_SORTS.some((sort) => sort === value);

export function SortSelect({ basePath, params }: SortSelectProps) {
  const selectId = useId();
  const { isPending, navigate } = useCatalogNavigation(basePath);
  const soonLabel = messages.site.soon;

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={selectId}>
        {text.label}
      </label>
      <select
        aria-busy={isPending || undefined}
        className={styles.select}
        id={selectId}
        onChange={(event) => {
          const { value } = event.target;
          if (isCatalogSort(value)) navigate(withSort(params, value));
        }}
        value={params.sort}
      >
        {choices.map((choice) => {
          const state = choice.feature ? getFeatureState(choice.feature) : 'live';
          if (state === 'hidden') return null;

          const isSoon = state === 'soon';
          return (
            <option disabled={isSoon} key={choice.value} value={choice.value}>
              {isSoon ? `${choice.label} (${soonLabel})` : choice.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
