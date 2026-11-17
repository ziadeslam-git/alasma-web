import { cache } from 'react';
import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';
import type { components } from '@/shared/lib/api';

export type Author = components['schemas']['AuthorDetailsDto'];
export type AuthorList = components['schemas']['PagedResultOfAuthorListItemDto'];
export const AUTHOR_REVALIDATE = 300;
const authorCache = () => nextFetch({ revalidate: AUTHOR_REVALIDATE, tags: ['authors'] });

// 'error' is a failed load (5xx, network, timeout), never shown as "no authors": the page renders an error state with a
// retry. An empty 200 stays 'ok' with no items, which the view shows as the empty state (Task 67).
export type AuthorsResult = { status: 'ok'; data: AuthorList } | { status: 'error' };

export async function getAuthors(
  page: number,
  options: ServerClientOptions = {},
): Promise<AuthorsResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/authors', {
      params: { query: { page, pageSize: 48 } },
      ...authorCache(),
    });
    return { status: 'ok', data: throwIfError(result) };
  } catch (error) {
    console.error(`[authors] Failed to fetch authors (${describeFailure(error)})`);
    return { status: 'error' };
  }
}

function describeFailure(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error
    ? String((error as { status: unknown }).status)
    : 'network';
}

export const getAuthor = cache(
  async (slug: string, options: ServerClientOptions = {}): Promise<Author | null> => {
    const result = await createServerClient(options).GET('/api/v1/authors/{slug}', {
      params: { path: { slug } },
      ...authorCache(),
    });
    if (result.response.status === 400 || result.response.status === 404) return null;
    throwIfError(result);
    return result.data ?? null;
  },
);

export async function getAuthorBooks(slug: string, options: ServerClientOptions = {}) {
  try {
    const result = await createServerClient(options).GET('/api/v1/books', {
      params: { query: { author: slug, page: 1, pageSize: 12 } },
      ...nextFetch({ revalidate: 300, tags: ['books'] }),
    });
    throwIfError(result);
    return result.data?.items ?? [];
  } catch {
    return [];
  }
}
