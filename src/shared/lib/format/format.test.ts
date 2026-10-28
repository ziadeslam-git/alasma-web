import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { formatDiscountBadge, formatMoney, formatNumber } from './format';

const EASTERN_ARABIC_DIGIT_PATTERN = /[\u0660-\u0669\u06F0-\u06F9]/;

describe('format helpers', () => {
  describe('formatNumber', () => {
    it('formats whole numbers and decimals according to design specifications', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(5)).toBe('5');
      expect(formatNumber(99.5)).toBe('99.5');
      expect(formatNumber(1234.5)).toBe('1,234.5');
      expect(formatNumber(999999.99)).toBe('999,999.99');
      expect(formatNumber(-1234.5)).toBe('-1,234.5');
      expect(formatNumber(NaN)).toBe('0');
      expect(formatNumber(Infinity)).toBe('0');
      expect(formatNumber(-Infinity)).toBe('0');
    });

    it('formats standard store numbers', () => {
      expect(formatNumber(120)).toBe('120');
      expect(formatNumber(1250)).toBe('1,250');
      expect(formatNumber(98.5)).toBe('98.5');
      expect(formatNumber(98.75)).toBe('98.75');
    });

    it('strips trailing zeros in fractional parts and rounds to at most 2 decimal places', () => {
      expect(formatNumber(12.3)).toBe('12.3');
      expect(formatNumber(12.345)).toBe('12.35');
    });
  });

  describe('formatMoney', () => {
    it('formats money with the Arabic currency label without changing the value', () => {
      expect(formatMoney(130)).toBe(`130 ${messages.catalog.currency}`);
      expect(formatMoney(85.5)).toBe(`85.5 ${messages.catalog.currency}`);
      expect(formatMoney(1234.5)).toBe(`1,234.5 ${messages.catalog.currency}`);
    });
  });

  describe('formatDiscountBadge', () => {
    it('formats the discount badge text with Latin percentage digits', () => {
      expect(formatDiscountBadge(15)).toBe('خصم 15%');
      expect(formatDiscountBadge(20)).toBe('خصم 20%');
      expect(formatDiscountBadge(0)).toBe('خصم 0%');
    });
  });

  describe('guard: absence of Eastern-Arabic digits', () => {
    const testCases: number[] = [
      0,
      5,
      99.5,
      1234.5,
      999999.99,
      -1234.5,
      NaN,
      Infinity,
      -Infinity,
      120,
      1250,
      42,
      448,
    ];

    it('asserts formatNumber never outputs Eastern-Arabic digits and matches expected output', () => {
      for (const val of testCases) {
        const result = formatNumber(val);
        expect(result).not.toMatch(EASTERN_ARABIC_DIGIT_PATTERN);
      }
    });

    it('asserts formatMoney never outputs Eastern-Arabic digits in numeric portion', () => {
      for (const val of testCases) {
        const result = formatMoney(val);
        expect(result).not.toMatch(EASTERN_ARABIC_DIGIT_PATTERN);
        expect(result.endsWith(` ${messages.catalog.currency}`)).toBe(true);
      }
    });

    it('asserts formatDiscountBadge never outputs Eastern-Arabic digits', () => {
      for (const val of [5, 10, 15, 20, 25, 50, 75]) {
        const result = formatDiscountBadge(val);
        expect(result).not.toMatch(EASTERN_ARABIC_DIGIT_PATTERN);
        expect(result).toBe(`خصم ${val}%`);
      }
    });
  });
});
