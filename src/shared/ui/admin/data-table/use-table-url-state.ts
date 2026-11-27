'use client';

import { useMemo } from 'react';

import { useUrlState } from '@/shared/hooks/use-url-state';

import { DEFAULT_PAGE_SIZE, readTableState } from './table-state';
import type { FilterDef } from './types';

// The one place a list screen reads and writes its URL: filters/search/pageSize -> router.replace (page back to 1),
// page -> an href for the pagination links.
export function useTableUrlState(
  filters: readonly FilterDef[],
  defaultPageSize: number = DEFAULT_PAGE_SIZE,
) {
  const url = useUrlState();
  const state = useMemo(
    () => readTableState(url.searchParams, filters, defaultPageSize),
    [defaultPageSize, filters, url.searchParams],
  );

  return {
    buildHref: (page: number) => url.hrefFor({ page }),
    isFiltered: Object.keys(state.values).length > 0,
    setFilters: url.update,
    setPageSize: (pageSize: number) => url.update({ pageSize }),
    state,
  };
}
