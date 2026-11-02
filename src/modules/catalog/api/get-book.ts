import { cache } from 'react';

import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';

import type { BookCardItem, BookDetails } from '../types';

export const BOOK_DETAILS_REVALIDATE_SECONDS = 600;
export const BOOK_DETAILS_CACHE_TAG = 'books';

export type BookResult = { kind: 'ok'; book: BookDetails } | { kind: 'notFound' };

export type GetBookOptions = ServerClientOptions;

/**
 * Fetches the book details by slug from GET /api/v1/books/{slug}.
 * Wrapped with React cache() so generateMetadata and BookPage share one in-flight request.
 * - Revalidates every 600s with the single cache tag 'books'.
 * - Returns { kind: 'ok', book } on success (HTTP 200).
 * - Returns { kind: 'notFound' } on 404 Not Found or 400 Bad Request.
 * - Throws an ApiError or network error on 5xx or connection failures, so Next ISR error handling / error.tsx takes over.
 */
export const getBook = cache(
  async (slug: string, options: GetBookOptions = {}): Promise<BookResult> => {
    const client = createServerClient(options);
    const result = await client.GET('/api/v1/books/{slug}', {
      params: { path: { slug } },
      ...nextFetch({
        revalidate: BOOK_DETAILS_REVALIDATE_SECONDS,
        tags: [BOOK_DETAILS_CACHE_TAG],
      }),
    });

    if (result.error) {
      const status = result.response.status;
      if (status === 404 || status === 400) {
        return { kind: 'notFound' };
      }
      throwIfError(result);
    }

    if (!result.data) {
      return { kind: 'notFound' };
    }

    return { kind: 'ok', book: result.data };
  },
);

/**
 * Fetches similar/related books from GET /api/v1/books/{slug}/related.
 * - Revalidates every 600s with the single cache tag 'books'.
 * - On failure (404, 500, network) or empty response, silently returns an empty array so the page renders cleanly.
 */
export const getRelatedBooks = cache(
  async (slug: string, options: GetBookOptions = {}): Promise<readonly BookCardItem[]> => {
    try {
      const client = createServerClient(options);
      const result = await client.GET('/api/v1/books/{slug}/related', {
        params: { path: { slug } },
        ...nextFetch({
          revalidate: BOOK_DETAILS_REVALIDATE_SECONDS,
          tags: [BOOK_DETAILS_CACHE_TAG],
        }),
      });

      if (result.error) {
        console.error(
          `[book] Failed to fetch related books for ${slug} (${result.response.status})`,
        );
        return [];
      }

      return result.data ?? [];
    } catch {
      console.error(`[book] Failed to fetch related books for ${slug} (network)`);
      return [];
    }
  },
);
