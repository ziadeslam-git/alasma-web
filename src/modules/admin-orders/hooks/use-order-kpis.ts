'use client';

import { useEffect, useState } from 'react';

import { countAdminOrders, type AdminOrdersQuery } from '../api/admin-orders-api';

export const KPI_KEYS = ['today', 'review', 'preparing', 'shipped'] as const;

export type KpiKey = (typeof KPI_KEYS)[number];

export type KpiValue =
  { state: 'error' } | { state: 'loading' } | { state: 'ready'; value: number };

type KpiFilter = Pick<AdminOrdersQuery, 'from' | 'status' | 'to'>;

// The API wants whole seconds; toISOString adds milliseconds.
function instant(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Today as the browser's own calendar day: from its first instant to the first instant of tomorrow.
export function todayRange(now: Date): Pick<KpiFilter, 'from' | 'to'> {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return { from: instant(start), to: instant(end) };
}

export function kpiFilters(now: Date): Record<KpiKey, KpiFilter> {
  return {
    preparing: { status: 'Preparing' },
    review: { status: 'PaymentReview' },
    shipped: { status: 'Shipped' },
    today: todayRange(now),
  };
}

const INITIAL: Record<KpiKey, KpiValue> = {
  preparing: { state: 'loading' },
  review: { state: 'loading' },
  shipped: { state: 'loading' },
  today: { state: 'loading' },
};

// Four counts from the list endpoint (one row each, only totalCount is read). Each card settles on its own, and one
// failing request leaves a dash on that card only.
export function useOrderKpis(): Record<KpiKey, KpiValue> {
  const [values, setValues] = useState(INITIAL);

  useEffect(() => {
    let isActive = true;
    const filters = kpiFilters(new Date());

    function settle(key: KpiKey, value: KpiValue) {
      if (isActive) setValues((current) => ({ ...current, [key]: value }));
    }

    for (const key of KPI_KEYS) {
      countAdminOrders(filters[key])
        .then((total) => settle(key, { state: 'ready', value: total }))
        .catch(() => settle(key, { state: 'error' }));
    }

    return () => {
      isActive = false;
    };
  }, []);

  return values;
}
