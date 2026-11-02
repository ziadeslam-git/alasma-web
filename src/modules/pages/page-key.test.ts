import { describe, expect, it } from 'vitest';
import { isPageKey, MAX_PAGE_KEY_LENGTH, PAGE_KEYS } from './page-key';

describe('page keys', () => {
  it('accepts only the eight public keys', () => {
    PAGE_KEYS.forEach((key) => expect(isPageKey(key)).toBe(true));
    for (const key of ['', 'About', 'other', 'a/b', 'a'.repeat(MAX_PAGE_KEY_LENGTH + 1)])
      expect(isPageKey(key)).toBe(false);
  });
});
