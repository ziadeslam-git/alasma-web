import { cache } from 'react';

import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';
import type { components } from '@/shared/lib/api/schema';

export type StaticPage = components['schemas']['StaticPagePublicDto'];
export type PageResult = { kind: 'ok'; page: StaticPage } | { kind: 'notFound' };
export const PAGE_REVALIDATE_SECONDS = 3600;
export const PAGE_CACHE_TAG = 'pages';

export const getPage = cache(
  async (key: string, options: ServerClientOptions = {}): Promise<PageResult> => {
    const result = await createServerClient(options).GET('/api/v1/pages/{key}', {
      params: { path: { key } },
      ...nextFetch({ revalidate: PAGE_REVALIDATE_SECONDS, tags: [PAGE_CACHE_TAG] }),
    });
    if (!result.response.ok) {
      if (result.response.status === 400 || result.response.status === 404)
        return { kind: 'notFound' };
      throwIfError(result);
    }
    return result.data ? { kind: 'ok', page: result.data } : { kind: 'notFound' };
  },
);
