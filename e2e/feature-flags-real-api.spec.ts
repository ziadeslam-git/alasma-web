import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import messages from '../src/i18n/messages/ar.json';
import {
  BACKEND_FEATURE_FLAGS,
  BACKEND_TO_FRONTEND_FEATURE_KEYS,
  resolveFeatureFlags,
} from '../src/shared/config/feature-flags/feature-flags';
import { features, type FeatureKey } from '../src/shared/config/features';
import {
  apiOrigin,
  isRealApiEnabled,
  realApiSkipReason,
  startRealApi,
  stopRealApi,
  webOrigin,
} from './support/real-api-server';

// Task 38 / 78: the feature-flags trial against the real API. It reads GET /api/v1/feature-flags/enabled, compares it
// with features.ts through the same resolver the site uses, and checks one mapped flag end to end in the footer.
// E2E_CAPTURE_DIR, when set, receives the comparison as feature-flags-comparison.json (outside the repo).
test.skip(!isRealApiEnabled, realApiSkipReason);
test.describe.configure({ mode: 'serial' });
test.use({ baseURL: webOrigin });

let enabled: string[] = [];

test.beforeAll(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-1280',
    'the comparison does not depend on the width',
  );
  test.setTimeout(300_000);
  await startRealApi();
});

test.afterAll(() => {
  stopRealApi();
});

test('the enabled endpoint returns a list of flag names and the comparison with features.ts is recorded', async ({}, testInfo) => {
  const response = await fetch(`${apiOrigin}/api/v1/feature-flags/enabled`);
  expect(response.status).toBe(200);
  const body: unknown = await response.json();
  expect(Array.isArray(body)).toBe(true);
  enabled = (body as unknown[]).map(String);

  const known = new Set<string>(BACKEND_FEATURE_FLAGS);
  const resolved = resolveFeatureFlags(enabled);
  const rows = BACKEND_FEATURE_FLAGS.map((flag) => ({
    flag,
    isEnabledByApi: enabled.includes(flag),
    frontend: BACKEND_TO_FRONTEND_FEATURE_KEYS[flag].map((key: FeatureKey) => ({
      key,
      local: features[key],
      resolved: resolved[key],
    })),
  }));
  const comparison = {
    enabled,
    unknownToFrontend: enabled.filter((flag) => !known.has(flag)),
    rows,
    changedByApi: (Object.keys(features) as FeatureKey[]).filter(
      (key) => features[key] !== resolved[key],
    ),
  };

  await testInfo.attach('feature-flags-comparison', {
    body: JSON.stringify(comparison, null, 2),
    contentType: 'application/json',
  });
  const captureDir = process.env.E2E_CAPTURE_DIR;
  if (captureDir) {
    writeFileSync(
      path.join(captureDir, 'feature-flags-comparison.json'),
      JSON.stringify(comparison, null, 2),
    );
  }
  console.log(JSON.stringify(comparison));
});

test('the footer CMS links follow the Cms.StaticPages flag', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  const footer = page.getByRole('contentinfo');
  const about = footer.getByText(messages.site.footer.about, { exact: true }).first();
  await expect(about).toBeVisible();

  if (enabled.includes('Cms.StaticPages')) {
    await expect(footer.getByRole('link', { name: messages.site.footer.about })).toHaveAttribute(
      'href',
      '/pages/about',
    );
  } else {
    await expect(footer.getByRole('link', { name: messages.site.footer.about })).toHaveCount(0);
  }
});
