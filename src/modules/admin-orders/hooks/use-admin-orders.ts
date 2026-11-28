'use client';

import { useEffect, useMemo, useState } from 'react';

import { mapApiError, type MappedAdminError } from '@/shared/lib/api/admin';
import { useTableUrlState } from '@/shared/ui/admin/data-table';

import {
  listAdminOrders,
  type AdminOrderList,
  type AdminOrdersQuery,
} from '../api/admin-orders-api';
import { buildUrlFilters, toAdminOrdersQuery } from '../lib/orders-filters';
import { useShippingZones } from './use-shipping-zones';

type Settled = { data: AdminOrderList | null; error: MappedAdminError | null; key: string };

// URL state -> one request. `isLoading` is derived (the last answer belongs to another key), so no state is set
// synchronously inside the effect.
export function useAdminOrders() {
  const zones = useShippingZones();
  const filters = useMemo(() => buildUrlFilters(zones.options), [zones.options]);
  const table = useTableUrlState(filters);
  const [settled, setSettled] = useState<Settled | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  // The query as text: a stable dependency, so the effect runs once per real change and not once per render.
  const queryText = JSON.stringify(toAdminOrdersQuery(table.state));
  const key = `${reloadCount}|${queryText}`;

  useEffect(() => {
    if (!zones.settled) return;

    let isActive = true;

    listAdminOrders(JSON.parse(queryText) as AdminOrdersQuery)
      .then((data) => {
        if (isActive) setSettled({ data, error: null, key });
      })
      .catch((cause: unknown) => {
        if (isActive) setSettled({ data: null, error: mapApiError(cause), key });
      });

    return () => {
      isActive = false;
    };
  }, [key, queryText, zones.settled]);

  const isCurrent = settled?.key === key;

  return {
    data: isCurrent ? (settled?.data ?? null) : null,
    error: isCurrent ? (settled?.error ?? null) : null,
    filters,
    isFiltered: table.isFiltered,
    isLoading: !zones.settled || !isCurrent,
    reload: () => setReloadCount((count) => count + 1),
    table,
    zonesFailed: zones.failed,
  };
}
