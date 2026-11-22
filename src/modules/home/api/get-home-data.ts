import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';

import type { HomeData, HomeSectionResult } from '../types';

export const HOME_REVALIDATE_SECONDS = 300;
// The trending band of the design has five slots.
export const HOME_BEST_SELLERS_COUNT = 5;

export const HOME_CACHE_TAGS = {
  categories: 'categories',
  featured: 'books:featured',
  newArrivals: 'books:new-arrivals',
  events: 'events',
  bestSellers: 'books:best-sellers',
} as const;

export type GetHomeDataOptions = ServerClientOptions;

function toSectionResult<T>(
  settled: PromiseSettledResult<readonly T[]>,
  sectionName: string,
): HomeSectionResult<T> {
  if (settled.status === 'rejected') {
    const status =
      typeof settled.reason === 'object' &&
      settled.reason !== null &&
      'status' in settled.reason &&
      typeof (settled.reason as { status: unknown }).status === 'number'
        ? (settled.reason as { status: number }).status
        : 'network';
    // Short server-side log with no secrets so a failing endpoint is observable without crashing the page.
    console.error(`[home] Failed to fetch ${sectionName} (${String(status)})`);
    return { items: [], status: 'error' };
  }

  const items = settled.value;
  if (items.length === 0) {
    return { items: [], status: 'empty' };
  }

  return { items, status: 'ok' };
}

// Fetches the three live home sections independently with Promise.allSettled. Each fetch uses Next's Data Cache
// (revalidate: 300 + per-resource tag) so a non-200 response is never written into the Data Cache while still allowing
// the page to render with per-section isolation when the API is unreachable at build time or for one endpoint.
export async function getHomeData(options: GetHomeDataOptions = {}): Promise<HomeData> {
  const client = createServerClient(options);

  const [
    featuredSettled,
    newArrivalsSettled,
    categoriesSettled,
    eventsSettled,
    bestSellersSettled,
  ] = await Promise.allSettled([
    client
      .GET('/api/v1/books/featured', {
        ...nextFetch({ revalidate: HOME_REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.featured] }),
      })
      .then(throwIfError),
    client
      .GET('/api/v1/books/new-arrivals', {
        ...nextFetch({
          revalidate: HOME_REVALIDATE_SECONDS,
          tags: [HOME_CACHE_TAGS.newArrivals],
        }),
      })
      .then(throwIfError),
    client
      .GET('/api/v1/categories', {
        ...nextFetch({ revalidate: HOME_REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.categories] }),
      })
      .then(throwIfError),
    client
      .GET('/api/v1/events', {
        params: { query: { when: 'upcoming', page: 1, pageSize: 1 } },
        ...nextFetch({ revalidate: HOME_REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.events] }),
      })
      .then(throwIfError)
      .then((page) => page.items),
    client
      .GET('/api/v1/books/best-sellers', {
        params: { query: { limit: HOME_BEST_SELLERS_COUNT } },
        ...nextFetch({ revalidate: HOME_REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.bestSellers] }),
      })
      .then(throwIfError),
  ]);

  return {
    featured: toSectionResult(featuredSettled, 'featured'),
    newArrivals: toSectionResult(newArrivalsSettled, 'newArrivals'),
    categories: toSectionResult(categoriesSettled, 'categories'),
    events: toSectionResult(eventsSettled, 'events'),
    bestSellers: toSectionResult(bestSellersSettled, 'bestSellers'),
  };
}
