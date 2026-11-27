'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { buildQuery } from '@/shared/lib/api/admin/build-query';

export const PAGE_KEY = 'page';
export const PAGE_SIZE_KEY = 'pageSize';
export const MAX_PAGE_SIZE = 100;

export type UrlPatchValue = string | number | null | undefined;
export type UrlPatch = Record<string, UrlPatchValue>;

function clampPageSize(value: string): string | null {
  const size = Number(value);

  if (!Number.isInteger(size) || size < 1) return null;

  return String(Math.min(size, MAX_PAGE_SIZE));
}

function normalize(key: string, value: UrlPatchValue): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  if (text === '') return null;
  if (key === PAGE_SIZE_KEY) return clampPageSize(text);
  if (key === PAGE_KEY) return text === '1' || !/^[1-9]\d*$/.test(text) ? null : text;

  return text;
}

// Pure core of the hook: the current query string + a patch -> the next query string. Any key other than `page`
// resets `page` (a filter change always goes back to the first page); `page=1` is never written; `pageSize` is
// capped at 100; an empty value removes the key. Keys are sorted, so one state is always one URL.
export function applyUrlPatch(search: string, patch: UrlPatch): string {
  const next: Record<string, string> = {};

  new URLSearchParams(search).forEach((value, key) => {
    next[key] = value;
  });

  const hasFilterChange = Object.keys(patch).some((key) => key !== PAGE_KEY);

  if (hasFilterChange) delete next[PAGE_KEY];

  for (const [key, raw] of Object.entries(patch)) {
    const value = normalize(key, raw);

    if (value === null) delete next[key];
    else next[key] = value;
  }

  return buildQuery(next);
}

export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const hrefFor = useCallback(
    (patch: UrlPatch) => {
      const query = applyUrlPatch(search, patch);

      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, search],
  );

  const update = useCallback(
    (patch: UrlPatch) => {
      router.replace(hrefFor(patch), { scroll: false });
    },
    [hrefFor, router],
  );

  return useMemo(
    () => ({ hrefFor, search, searchParams, update }),
    [hrefFor, search, searchParams, update],
  );
}
