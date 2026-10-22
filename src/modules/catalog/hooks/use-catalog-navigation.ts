'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { buildCatalogHref } from '../url/catalog-href';
import type { CatalogParams } from '../url/catalog-params';

// The URL is the only state: a control builds the next params, this hook writes them into the URL. replace (not
// push) keeps the history clean while a visitor fiddles with filters, and scroll: false keeps the page position.
export function useCatalogNavigation(basePath: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (params: CatalogParams) => {
      const href = buildCatalogHref(basePath, params);
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [basePath, router],
  );

  return { isPending, navigate };
}
