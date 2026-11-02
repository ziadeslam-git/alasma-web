import { describe, expect, it } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { formatDate, formatDateTime } from './date';

describe('Cairo date formatting', () => {
  it('uses winter time across midnight and summer daylight time', () => {
    expect(formatDateTime('2026-01-15T22:30:00Z')).toBe(
      `16 ${messages.dateFormat.months[0]} 2026${messages.dateFormat.separator}12:30 ${messages.dateFormat.am}`,
    );
    expect(formatDateTime('2026-07-15T12:05:00Z')).toBe(
      `15 ${messages.dateFormat.months[6]} 2026${messages.dateFormat.separator}3:05 ${messages.dateFormat.pm}`,
    );
  });
  it('rejects invalid dates', () => {
    expect(formatDate('invalid')).toBe('—');
  });
});
