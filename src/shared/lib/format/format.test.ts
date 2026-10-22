import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { formatDiscountBadge, formatMoney, formatNumber } from './format';

describe('format helpers', () => {
  it('formats whole numbers and decimals with Western Arabic digits', () => {
    expect(formatNumber(120)).toBe('120');
    expect(formatNumber(1250)).toBe('1,250');
    expect(formatNumber(98.5)).toBe('98.5');
    expect(formatNumber(98.75)).toBe('98.75');
  });

  it('formats money with the Arabic currency label without changing the value', () => {
    expect(formatMoney(130)).toBe(`130 ${messages.catalog.currency}`);
    expect(formatMoney(85.5)).toBe(`85.5 ${messages.catalog.currency}`);
  });

  it('formats the discount badge text', () => {
    expect(formatDiscountBadge(15)).toBe('خصم 15%');
    expect(formatDiscountBadge(20)).toBe('خصم 20%');
  });
});
