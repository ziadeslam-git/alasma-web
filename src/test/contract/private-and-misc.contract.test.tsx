import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import { createServerClient } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import { ORIGIN, sample, textProblems } from '@/test/contract/contract-helpers';

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');
  return {
    getApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
  };
});

import { listShippingZones } from '@/modules/addresses/api/addresses';
import { AddressForm } from '@/modules/addresses/components/address-form';
import { listOrderZones } from '@/modules/orders/api/orders-api';
import { isPageKey } from '@/modules/pages';

type Zone = { id: number; nameAr: string; shippingPrice: number };
type Methods = Array<{ method: string; details: null | { transferNumbers: unknown[] } }>;

describe('shipping-zones sample', () => {
  it('is read by both zone readers and offered in the address form', async () => {
    const zones = sample<Zone[]>('shipping-zones.json');
    server.use(http.get('http://localhost/api/v1/shipping/zones', () => HttpResponse.json(zones)));

    const fromAddresses = await listShippingZones();
    const fromOrders = await listOrderZones();
    expect(fromAddresses).toEqual(zones);
    expect(fromOrders).toEqual(zones);
    expect(zones).toHaveLength(27);

    const { container } = render(
      <AddressForm
        zones={fromAddresses}
        onSave={async () => undefined}
        onCancel={() => undefined}
      />,
    );
    const select = screen.getByRole('combobox', { name: /./ });
    for (const zone of zones) {
      expect(screen.getByRole('option', { name: new RegExp(zone.nameAr) })).toBeInTheDocument();
    }
    expect(select).toBeInTheDocument();
    expect(textProblems(container)).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// No frontend reader or view exists yet for these three samples (checkout and the sitemap are not built, and
// feature flags are a local registry), so they go through the typed generated client, which is the code path
// any future reader will use.
describe('samples without a reader yet, through the typed client', () => {
  it('payment-methods: known methods and a transfer number list for ManualTransfer', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/payment-methods`, () =>
        HttpResponse.json(sample('payment-methods-dev-customer.json')),
      ),
    );
    const result = await createServerClient({ origin: ORIGIN }).GET('/api/v1/payment-methods');
    expect(result.error).toBeUndefined();
    const methods = (result.data ?? []) as unknown as Methods;
    expect(methods.map((item) => item.method)).toEqual(['CashOnDelivery', 'ManualTransfer']);
    // Finding: the sample omits `details` for CashOnDelivery although the contract marks it required (nullable).
    // The frontend must treat a missing value like null.
    expect(methods[0]?.details ?? null).toBeNull();
    expect(methods[1]?.details?.transferNumbers).toHaveLength(2);
  });

  it('sitemap: page keys are valid frontend page keys and every entry has a slug and a date', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/sitemap`, () =>
        HttpResponse.json(sample('sitemap-trimmed-3.json')),
      ),
    );
    const result = await createServerClient({ origin: ORIGIN }).GET('/api/v1/sitemap');
    const data = result.data;
    expect(data).toBeDefined();
    for (const page of data?.pages ?? []) expect(isPageKey(page.key)).toBe(true);
    for (const entry of [
      ...(data?.books ?? []),
      ...(data?.authors ?? []),
      ...(data?.categories ?? []),
    ]) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
      expect(Number.isNaN(Date.parse(entry.updatedAt))).toBe(false);
    }
  });

  it('feature-flags: the enabled list is an array of dotted flag names', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/feature-flags/enabled`, () =>
        HttpResponse.json(sample('feature-flags-enabled.json')),
      ),
    );
    const result = await createServerClient({ origin: ORIGIN }).GET(
      '/api/v1/feature-flags/enabled',
    );
    expect(result.data).toContain('Payments.ManualTransfer');
    for (const flag of result.data ?? []) expect(flag).toMatch(/^[A-Za-z]+\.[A-Za-z]+$/);
  });
});
