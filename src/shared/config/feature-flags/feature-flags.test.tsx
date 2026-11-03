import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { features } from '@/shared/config/features';
import { defaultApiOrigin } from '@/shared/lib/api';
import { FeatureGate, FeatureLink } from '@/shared/ui/soon';
import enabledFlagsSample from '@/test/fixtures/api-samples/feature-flags-enabled.json';

import {
  BACKEND_FEATURE_FLAGS,
  fetchEnabledBackendFlags,
  FeatureFlagsProvider,
  resolveFeatureFlags,
} from './index';

describe('visitor feature flags (T7)', () => {
  it('matches every backend flag name in the real API sample', () => {
    expect([...BACKEND_FEATURE_FLAGS].sort()).toEqual([...enabledFlagsSample].sort());
  });

  it('keeps enabled built features live and unbuilt features soon when all backend flags are enabled', () => {
    const resolved = resolveFeatureFlags(enabledFlagsSample);

    expect(resolved['static-pages']).toBe('live');
    expect(resolved['catalog-search']).toBe('live');
    expect(resolved['checkout-flow']).toBe('live');
    // Unbuilt features opened by the backend stay 'soon' regardless of the backend:
    expect(resolved['wishlist-heart']).toBe('soon');
    expect(resolved['reviews-section']).toBe('soon');
    expect(resolved['reservations-notify-me']).toBe('soon');
    expect(resolved['home-banners']).toBe('soon');
    expect(resolved['publish-packages']).toBe('soon');
    // Hidden features remain 'hidden':
    expect(resolved['quick-view']).toBe('hidden');
  });

  it('turns a built feature into soon when its backend flag is disabled', () => {
    const withoutStaticPages = enabledFlagsSample.filter((flag) => flag !== 'Cms.StaticPages');
    const resolved = resolveFeatureFlags(withoutStaticPages);

    expect(features['static-pages']).toBe('live');
    expect(resolved['static-pages']).toBe('soon');
    // Unmapped live features remain live:
    expect(resolved['catalog-search']).toBe('live');
  });

  it('ignores unknown backend flags without throwing or opening unbuilt features', () => {
    const resolved = resolveFeatureFlags([
      ...enabledFlagsSample,
      'Unknown.FutureFlag',
      'Catalog.SomethingNew',
    ]);

    expect(resolved['static-pages']).toBe('live');
    expect(resolved['wishlist-heart']).toBe('soon');
    expect(resolved['quick-view']).toBe('hidden');
  });

  it('falls back to the local features registry when the backend call fails (null)', () => {
    const resolved = resolveFeatureFlags(null);

    expect(resolved).toEqual(features);
  });

  it('fetches GET /api/v1/feature-flags/enabled and returns null on network or 5xx failure', async () => {
    server.use(
      http.get(`${defaultApiOrigin}/api/v1/feature-flags/enabled`, () =>
        HttpResponse.json(enabledFlagsSample),
      ),
    );

    const enabled = await fetchEnabledBackendFlags();
    expect(enabled).toEqual(enabledFlagsSample);

    server.use(
      http.get(`${defaultApiOrigin}/api/v1/feature-flags/enabled`, () =>
        HttpResponse.json({ status: 500, title: 'Server Error' }, { status: 500 }),
      ),
    );

    const fallback = await fetchEnabledBackendFlags();
    expect(fallback).toBeNull();
  });

  it('drives FeatureGate and FeatureLink from the resolved feature flags context', () => {
    const disabledStaticPages = resolveFeatureFlags([]);

    const { rerender, container } = render(
      <FeatureFlagsProvider value={disabledStaticPages}>
        <FeatureGate feature="static-pages" label="قريباً">
          <span>About page</span>
        </FeatureGate>
        <FeatureLink feature="static-pages" href="/pages/about" label="قريباً">
          Link text
        </FeatureLink>
      </FeatureFlagsProvider>,
    );

    // Because Cms.StaticPages is disabled in [], both FeatureGate and FeatureLink become inert "soon"
    expect(container.querySelectorAll('[data-feature="static-pages"]')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Link text' })).toBeNull();

    const enabledAll = resolveFeatureFlags(enabledFlagsSample);
    rerender(
      <FeatureFlagsProvider value={enabledAll}>
        <FeatureGate feature="static-pages" label="قريباً">
          <span>About page</span>
        </FeatureGate>
        <FeatureLink feature="static-pages" href="/pages/about" label="قريباً">
          Link text
        </FeatureLink>
      </FeatureFlagsProvider>,
    );

    expect(container.querySelectorAll('[data-feature="static-pages"]')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Link text' })).toHaveAttribute('href', '/pages/about');
  });
});
