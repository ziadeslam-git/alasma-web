import { describe, expect, it } from 'vitest';

import { listDate } from './orders-columns';

const NOW = new Date(2026, 10, 28);

describe('listDate', () => {
  it("leaves the year out for this year's orders, like the frame", () => {
    expect(listDate('2026-10-12T10:00:00Z', NOW)).toBe('12 أكتوبر');
    expect(listDate('2026-09-15T10:00:00Z', NOW)).toBe('15 سبتمبر');
  });

  it('keeps the year for an older order', () => {
    expect(listDate('2025-10-12T10:00:00Z', NOW)).toBe('12 أكتوبر 2025');
  });

  it('shows a dash for a value that is not a date', () => {
    expect(listDate('not a date', NOW)).toBe('—');
  });
});
