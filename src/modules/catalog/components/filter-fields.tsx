'use client';

import { useMemo } from 'react';

import messages from '@/i18n/messages/ar.json';

import { withFilter } from '../url/catalog-href';
import type { CatalogParams } from '../url/catalog-params';
import { buildSelectOptions } from '../url/select-options';
import type { FilterOptions } from '../types';
import { FilterGroup } from './filter-group';
import { FilterOption } from './filter-option';
import { FilterRadioList } from './filter-radio-list';
import { PriceRangeFilter } from './price-range-filter';
import { SoonFilterGroups } from './soon-filter-groups';

export type FilterFieldsProps = {
  onChange: (next: CatalogParams) => void;
  options: FilterOptions;
  params: CatalogParams;
  priceDebounceMs?: number;
};

// Every filter group of the design, controlled by `params`. The sidebar feeds it the URL; the mobile sheet feeds it a
// draft. It never reads or writes the URL itself.
export function FilterFields({ onChange, options, params, priceDebounceMs }: FilterFieldsProps) {
  const text = messages.catalog.filters;
  const groups = text.groups;
  const selectOptions = useMemo(() => buildSelectOptions(options), [options]);

  return (
    <div>
      <FilterGroup title={groups.category}>
        <FilterRadioList
          allLabel={groups.categoryAll}
          onChange={(category) => onChange(withFilter(params, { category }))}
          options={selectOptions.categories}
          value={params.category}
        />
      </FilterGroup>
      <FilterGroup title={groups.author}>
        <FilterRadioList
          allLabel={groups.authorAll}
          onChange={(author) => onChange(withFilter(params, { author }))}
          options={selectOptions.authors}
          search={{ label: groups.authorSearch, noMatchLabel: groups.authorNone }}
          value={params.author}
        />
      </FilterGroup>
      <FilterGroup title={groups.price}>
        <PriceRangeFilter
          debounceMs={priceDebounceMs}
          maxPrice={params.maxPrice}
          minPrice={params.minPrice}
          onApply={(range) => onChange(withFilter(params, range))}
        />
      </FilterGroup>
      <FilterGroup title={groups.availability}>
        <FilterOption
          checked={params.inStock}
          kind="checkbox"
          label={groups.inStock}
          onChange={() => onChange(withFilter(params, { inStock: !params.inStock }))}
        />
        <FilterOption
          checked={params.hasDiscount}
          kind="checkbox"
          label={groups.hasDiscount}
          onChange={() => onChange(withFilter(params, { hasDiscount: !params.hasDiscount }))}
        />
      </FilterGroup>
      <FilterGroup title={groups.publisher}>
        <FilterRadioList
          allLabel={groups.publisherAll}
          onChange={(publisher) => onChange(withFilter(params, { publisher }))}
          options={selectOptions.publishers}
          value={params.publisher}
        />
      </FilterGroup>
      <SoonFilterGroups />
    </div>
  );
}
