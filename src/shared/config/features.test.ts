import { describe, expect, it } from 'vitest';

import { features, getFeatureState, isLive, type FeatureKey, type FeatureState } from './features';

const expectedLiveKeys = [
  'catalog-search',
  'catalog-filters-basic',
  'catalog-sort-basic',
  'catalog-authors',
  'catalog-categories',
  'static-pages',
  'auth-login',
  'auth-register',
  'auth-password-reset',
  'auth-email-confirm',
] as const satisfies readonly FeatureKey[];

describe('features registry', () => {
  it('contains only valid feature states', () => {
    const validStates: readonly FeatureState[] = ['live', 'soon', 'hidden'];

    Object.values(features).forEach((state) => {
      expect(validStates).toContain(state);
    });
  });

  it('contains exactly the delivered live features', () => {
    const liveKeys = (Object.keys(features) as FeatureKey[]).filter(isLive);

    expect(liveKeys).toEqual(expectedLiveKeys);
  });

  it('keeps the deferred navigation areas marked as soon', () => {
    expect(getFeatureState('cart-page')).toBe('soon');
    expect(getFeatureState('checkout-flow')).toBe('soon');
    expect(getFeatureState('account-area')).toBe('soon');
    expect(getFeatureState('publish-packages')).toBe('soon');
  });

  it('keeps resend-confirmation soon until the backend endpoint (S4) is delivered', () => {
    expect(getFeatureState('resend-confirmation')).toBe('soon');
  });

  it('keeps quick-view hidden on book cards', () => {
    expect(getFeatureState('quick-view')).toBe('hidden');
  });

  it('contains no duplicate keys and exposes consistent helpers', () => {
    const keys = Object.keys(features) as FeatureKey[];

    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => {
      expect(getFeatureState(key)).toBe(features[key]);
      expect(isLive(key)).toBe(features[key] === 'live');
    });
  });
});
