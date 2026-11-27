import { describe, expect, it } from 'vitest';

import { applyUrlPatch } from '@/shared/hooks/use-url-state';

import { readTableState, toApiParams } from './table-state';
import type { FilterDef } from './types';

const FILTERS: readonly FilterDef[] = [
  { key: 'q', label: 'q', type: 'text' },
  {
    key: 'status',
    label: 's',
    options: [
      { label: 'a', value: 'PendingPayment' },
      { label: 'b', value: 'Shipped' },
    ],
    type: 'status',
  },
  { fromKey: 'from', label: 'p', maxDays: 366, toKey: 'to', type: 'dateRange' },
];

describe('readTableState / toApiParams', () => {
  it('reads defaults from an empty URL', () => {
    expect(readTableState(new URLSearchParams(), FILTERS, 25)).toEqual({
      page: 1,
      pageSize: 25,
      values: {},
    });
  });

  it('round trip: state -> URL -> state is identical', () => {
    const query = applyUrlPatch('', {
      from: '2026-01-01',
      pageSize: 50,
      q: 'novel',
      status: 'Shipped',
      to: '2026-02-01',
    });
    const state = readTableState(new URLSearchParams(query), FILTERS);

    expect(state).toEqual({
      page: 1,
      pageSize: 50,
      values: { from: '2026-01-01', q: 'novel', status: 'Shipped', to: '2026-02-01' },
    });
    expect(applyUrlPatch('', { ...state.values, pageSize: state.pageSize })).toBe(query);
  });

  it('a numeric status (?status=3) is dropped and never reaches the API params', () => {
    const state = readTableState(new URLSearchParams('status=3&q=a'), FILTERS);

    expect(state.values).toEqual({ q: 'a' });
    expect(toApiParams(state)).toEqual({ page: 1, pageSize: 25, q: 'a' });
  });

  it('drops an unknown status name and a malformed date', () => {
    const state = readTableState(
      new URLSearchParams('status=Nope&from=12/01/2026&to=2026-02-30x'),
      FILTERS,
    );

    expect(state.values).toEqual({});
  });

  it('caps pageSize at 100 and ignores a bad page', () => {
    const state = readTableState(new URLSearchParams('pageSize=500&page=abc'), FILTERS);

    expect(state.pageSize).toBe(100);
    expect(state.page).toBe(1);
  });

  it('API params carry page and pageSize plus only the filters that are set', () => {
    const state = readTableState(new URLSearchParams('page=3&status=PendingPayment'), FILTERS, 10);

    expect(toApiParams(state)).toEqual({ page: 3, pageSize: 10, status: 'PendingPayment' });
  });
});
