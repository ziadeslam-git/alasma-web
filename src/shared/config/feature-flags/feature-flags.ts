import { cache } from 'react';

import {
  features,
  getFeatureState,
  type FeatureKey,
  type FeatureState,
} from '@/shared/config/features';
import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';

export const FEATURE_FLAGS_REVALIDATE_SECONDS = 60;
export const FEATURE_FLAGS_CACHE_TAG = 'feature-flags';

/**
 * Backend feature flag keys returned by `GET /api/v1/feature-flags/enabled`.
 */
export const BACKEND_FEATURE_FLAGS = [
  'Catalog.Bundles',
  'Catalog.Reservations',
  'Catalog.Reviews',
  'Catalog.Wishlist',
  'Cms.StaticPages',
  'Marketing.Banners',
  'Marketing.Coupons',
  'Marketing.Events',
  'Marketing.Newsletter',
  'Marketing.Quotes',
  'Orders.Alerts',
  'Orders.InvoicePrint',
  'Payments.Cod',
  'Payments.ManualTransfer',
  'Publishing.ManuscriptRequests',
  'Publishing.Packages',
  'Reports.Dashboard',
] as const;

export type BackendFeatureFlag = (typeof BACKEND_FEATURE_FLAGS)[number];

/**
 * Mapping from backend flag names to the corresponding frontend `FeatureKey` entries in `features.ts`.
 */
export const BACKEND_TO_FRONTEND_FEATURE_KEYS: Readonly<
  Record<BackendFeatureFlag, readonly FeatureKey[]>
> = {
  'Catalog.Bundles': ['offers-bundles'],
  'Catalog.Reservations': ['reservations-notify-me'],
  'Catalog.Reviews': ['reviews-section', 'review-helpful'],
  'Catalog.Wishlist': ['wishlist-heart'],
  'Cms.StaticPages': ['static-pages'],
  'Marketing.Banners': ['home-banners'],
  'Marketing.Coupons': ['public-coupons-list'],
  'Marketing.Events': ['home-events', 'search-tab-events'],
  'Marketing.Newsletter': ['home-newsletter'],
  'Marketing.Quotes': ['home-quotes'],
  'Orders.Alerts': ['notifications-center'],
  'Orders.InvoicePrint': ['order-invoice'],
  'Payments.Cod': [],
  'Payments.ManualTransfer': [],
  'Publishing.ManuscriptRequests': [],
  'Publishing.Packages': ['publish-packages'],
  'Reports.Dashboard': [],
};

/**
 * Reverse lookup: for each mapped `FeatureKey`, which backend flag controls it.
 */
export const FRONTEND_TO_BACKEND_FLAG: Readonly<Partial<Record<FeatureKey, BackendFeatureFlag>>> =
  (() => {
    const reverse: Partial<Record<FeatureKey, BackendFeatureFlag>> = {};
    for (const [backendFlag, frontendKeys] of Object.entries(
      BACKEND_TO_FRONTEND_FEATURE_KEYS,
    ) as Array<[BackendFeatureFlag, readonly FeatureKey[]]>) {
      for (const key of frontendKeys) {
        reverse[key] = backendFlag;
      }
    }
    return reverse;
  })();

export type ResolvedFeatureStates = Readonly<Record<FeatureKey, FeatureState>>;

/**
 * Pure resolver combining the local `features` registry with the backend's enabled flag list:
 * - When `enabledBackendFlags` is `null` or `undefined` (e.g. API failure fallback), returns the local registry as-is.
 * - A feature that is `'hidden'` locally stays `'hidden'`.
 * - A feature the frontend has not built (`'soon'` locally) stays `'soon'` regardless of the backend.
 * - A built feature (`'live'` locally) mapped to a backend flag becomes `'soon'` when that backend flag is absent
 *   from `enabledBackendFlags`; otherwise it stays `'live'`.
 * - Unknown backend flag names are ignored safely.
 */
export function resolveFeatureFlags(
  enabledBackendFlags: readonly string[] | null | undefined,
): ResolvedFeatureStates {
  const keys = Object.keys(features) as FeatureKey[];
  const enabledSet = enabledBackendFlags ? new Set(enabledBackendFlags) : null;
  const resolved = {} as Record<FeatureKey, FeatureState>;

  for (const key of keys) {
    const localState = getFeatureState(key);
    if (localState === 'hidden' || localState === 'soon' || enabledSet === null) {
      resolved[key] = localState;
      continue;
    }

    const mappedBackendFlag = FRONTEND_TO_BACKEND_FLAG[key];
    if (mappedBackendFlag && !enabledSet.has(mappedBackendFlag)) {
      resolved[key] = 'soon';
    } else {
      resolved[key] = 'live';
    }
  }

  return resolved;
}

export function resolveSingleFeatureState(
  key: FeatureKey,
  resolvedStates?: ResolvedFeatureStates | null,
): FeatureState {
  if (resolvedStates && key in resolvedStates) {
    return resolvedStates[key];
  }
  return getFeatureState(key);
}

/**
 * Fetches `GET /api/v1/feature-flags/enabled` on the server with a 60s revalidate window and tag `'feature-flags'`.
 * Never uses `cookies()` or `headers()`, and falls back to `null` (local feature registry) on any error.
 */
export async function fetchEnabledBackendFlags(
  options: ServerClientOptions = {},
): Promise<readonly string[] | null> {
  try {
    const client = createServerClient(options);
    const result = await client.GET('/api/v1/feature-flags/enabled', {
      ...nextFetch({
        revalidate: FEATURE_FLAGS_REVALIDATE_SECONDS,
        tags: [FEATURE_FLAGS_CACHE_TAG],
      }),
    });

    if (result.error) {
      throwIfError(result);
    }

    return Array.isArray(result.data) ? result.data : null;
  } catch {
    return null;
  }
}

export const getResolvedFeatureFlags = cache(
  async (options: ServerClientOptions = {}): Promise<ResolvedFeatureStates> => {
    const enabled = await fetchEnabledBackendFlags(options);
    return resolveFeatureFlags(enabled);
  },
);
