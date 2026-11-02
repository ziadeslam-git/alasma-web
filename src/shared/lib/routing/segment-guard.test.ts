import { describe, expect, it } from 'vitest';

import { isValidSegment, segmentRules } from './segment-guard';

describe('isValidSegment', () => {
  for (const [name, rule] of Object.entries(segmentRules)) {
    it(`validates boundaries and unsafe encodings for ${name}`, () => {
      expect(isValidSegment('book-1', rule)).toBe(true);
      expect(isValidSegment('a'.repeat(rule.maxLength), rule)).toBe(true);
      expect(isValidSegment('a'.repeat(rule.maxLength + 1), rule)).toBe(false);
      for (const invalid of ['', '%20', '%E0%A4%A', 'a%00b', 'a%7Fb', 'a%2Fb', 'a%5Cb']) {
        expect(isValidSegment(invalid, rule)).toBe(false);
      }
      expect(isValidSegment(encodeURIComponent('\u0643\u062a\u0627\u0628'), rule)).toBe(
        name !== 'pages',
      );
    });
  }

  it('accepts one decoding only and enforces page key characters', () => {
    const book = segmentRules.books;
    const page = segmentRules.pages;
    expect(book && isValidSegment('%252F', book)).toBe(true);
    expect(page && isValidSegment('About', page)).toBe(false);
    expect(page && isValidSegment('about_us', page)).toBe(false);
  });
});
