import { MAX_PAGE_SIZE, PAGE_KEY, PAGE_SIZE_KEY } from '@/shared/hooks/use-url-state';

import type { FilterDef, TableState } from './types';

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NUMERIC_PATTERN = /^\d+$/;

function readPositiveInt(raw: string | null): number | null {
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return null;

  return Number(raw);
}

export function readFilterValue(
  filter: FilterDef,
  params: URLSearchParams,
): Record<string, string> {
  if (filter.type === 'text') {
    const text = (params.get(filter.key) ?? '').trim();

    return text ? { [filter.key]: text } : {};
  }

  if (filter.type === 'dateRange') {
    const values: Record<string, string> = {};
    const from = params.get(filter.fromKey);
    const to = params.get(filter.toKey);

    if (from && DATE_PATTERN.test(from)) values[filter.fromKey] = from;
    if (to && DATE_PATTERN.test(to)) values[filter.toKey] = to;

    return values;
  }

  const value = params.get(filter.key);
  const isKnown = value !== null && filter.options.some((option) => option.value === value);

  // A status in the URL must be one of the enum names. A hand-typed ?status=3 is dropped here, so it is never
  // read back into the screen and never sent to the API.
  if (!isKnown || (filter.type === 'status' && NUMERIC_PATTERN.test(value))) return {};

  return { [filter.key]: value };
}

// URL -> state. Anything invalid (page=abc, pageSize=500, an unknown select value) falls back to the default.
export function readTableState(
  params: URLSearchParams,
  filters: readonly FilterDef[],
  defaultPageSize: number = DEFAULT_PAGE_SIZE,
): TableState {
  const values: Record<string, string> = {};

  for (const filter of filters) Object.assign(values, readFilterValue(filter, params));

  const pageSize = Math.min(
    readPositiveInt(params.get(PAGE_SIZE_KEY)) ?? defaultPageSize,
    MAX_PAGE_SIZE,
  );

  return { page: readPositiveInt(params.get(PAGE_KEY)) ?? 1, pageSize, values };
}

// State -> the query params of the list endpoint (page, pageSize and only the filters that are set).
export function toApiParams(state: TableState): Record<string, string | number> {
  return { ...state.values, page: state.page, pageSize: state.pageSize };
}

export function filterKeys(filters: readonly FilterDef[]): string[] {
  return filters.flatMap((filter) =>
    filter.type === 'dateRange' ? [filter.fromKey, filter.toKey] : [filter.key],
  );
}
