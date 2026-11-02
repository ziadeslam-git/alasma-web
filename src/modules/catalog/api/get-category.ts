import { cache } from 'react';

import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';

// The database slug column is limited to 200 even though the backend validator permits 350.
export const MAX_CATEGORY_SLUG_LENGTH = 200;
export const CATEGORY_REVALIDATE_SECONDS = 300;
export const CATEGORY_CACHE_TAG = 'categories';

export const getCategory = cache(async (slug: string, options: ServerClientOptions = {}) => {
  const result = await createServerClient(options).GET('/api/v1/categories/{slug}', {
    params: { path: { slug } },
    ...nextFetch({ revalidate: CATEGORY_REVALIDATE_SECONDS, tags: [CATEGORY_CACHE_TAG] }),
  });
  if (!result.response.ok) {
    if (result.response.status === 400 || result.response.status === 404)
      return { kind: 'notFound' } as const;
    throwIfError(result);
  }
  return result.data
    ? ({ kind: 'ok', category: result.data } as const)
    : ({ kind: 'notFound' } as const);
});
