'use client';

import { useEffect, useMemo, useState } from 'react';

import type { SelectOption } from '@/shared/ui/admin/data-table';

import { listShippingZones } from '../api/admin-orders-api';

type ZonesResult = { failed: boolean; options: SelectOption[] } | null;

// The zone filter's options (the public zone list). The orders request waits until this has settled, so a zone in
// the URL is read once and the list is not fetched twice. A failure leaves the filter empty; it never blocks the list.
export function useShippingZones() {
  const [result, setResult] = useState<ZonesResult>(null);

  useEffect(() => {
    let isActive = true;

    listShippingZones()
      .then((zones) => {
        if (isActive) {
          setResult({
            failed: false,
            options: zones.map((zone) => ({ label: zone.nameAr, value: String(zone.id) })),
          });
        }
      })
      .catch(() => {
        if (isActive) setResult({ failed: true, options: [] });
      });

    return () => {
      isActive = false;
    };
  }, []);

  return useMemo(
    () => ({
      failed: result?.failed ?? false,
      options: result?.options ?? [],
      settled: result !== null,
    }),
    [result],
  );
}
