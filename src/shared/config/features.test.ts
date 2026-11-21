import { describe, expect, it } from 'vitest';

import { features, getFeatureState, isLive, type FeatureKey, type FeatureState } from './features';

const expectedLiveKeys = [
  'reviews-section',
  'wishlist-heart',
  'home-event-card',
  'home-newsletter',
  'cart-page',
  'profile-edit',
  'order-invoice',
  'payment-proof',
  'payment-receipt',
  'checkout-flow',
  'account-area',
  'resend-confirmation',
  'catalog-search',
  'catalog-filters-basic',
  'catalog-sort-basic',
  'catalog-authors',
  'catalog-categories',
  'catalog-categories-index',
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
    expect(getFeatureState('profile-edit')).toBe('live');
    expect(getFeatureState('checkout-flow')).toBe('live');
    expect(getFeatureState('account-area')).toBe('live');
    expect(getFeatureState('publish-packages')).toBe('soon');
  });

  it('keeps buy-now soon while checkout is not built, without changing checkout-flow', () => {
    expect(getFeatureState('buy-now')).toBe('soon');
    expect(getFeatureState('checkout-flow')).toBe('live');
  });

  it('keeps email-change soon until its confirmation page ships (Task 88b)', () => {
    expect(getFeatureState('email-change')).toBe('soon');
    expect(getFeatureState('profile-edit')).toBe('live');
  });

  it('has resend-confirmation live now that POST /auth/resend-confirmation is delivered (Task 88)', () => {
    expect(getFeatureState('resend-confirmation')).toBe('live');
  });

  it('has payment-proof, payment-receipt (Task 89) and order-invoice (Task 90) live', () => {
    expect(getFeatureState('payment-proof')).toBe('live');
    expect(getFeatureState('payment-receipt')).toBe('live');
    expect(getFeatureState('order-invoice')).toBe('live');
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
