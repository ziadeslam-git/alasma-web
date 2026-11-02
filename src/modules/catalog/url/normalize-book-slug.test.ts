import { describe, expect, it } from 'vitest';

import { MAX_BOOK_SLUG_LENGTH, normalizeBookSlug } from './normalize-book-slug';

describe('normalizeBookSlug', () => {
  it('gives the exact same result for an encoded Arabic slug and the pre-decoded slug', () => {
    const rawArabic = 'ظلال-الحكاية-رواية';
    const encoded = encodeURIComponent(rawArabic);

    expect(normalizeBookSlug(encoded)).toBe(rawArabic);
    expect(normalizeBookSlug(rawArabic)).toBe(rawArabic);
  });

  it('rejects a malformed percent sequence as invalid (returns undefined)', () => {
    expect(normalizeBookSlug('%')).toBeUndefined();
    expect(normalizeBookSlug('%E0%A4')).toBeUndefined();
    expect(normalizeBookSlug('%2')).toBeUndefined();
    expect(normalizeBookSlug('book-%ZZ-slug')).toBeUndefined();
    expect(normalizeBookSlug('a%b')).toBeUndefined();
  });

  it('accepts a slug of length 350 and rejects a slug of length 351', () => {
    const slug350 = 'a'.repeat(MAX_BOOK_SLUG_LENGTH);
    const slug351 = 'a'.repeat(MAX_BOOK_SLUG_LENGTH + 1);

    expect(normalizeBookSlug(slug350)).toBe(slug350);
    expect(normalizeBookSlug(slug351)).toBeUndefined();
  });

  it('rejects empty or whitespace-only inputs', () => {
    expect(normalizeBookSlug('')).toBeUndefined();
    expect(normalizeBookSlug('   ')).toBeUndefined();
    expect(normalizeBookSlug('\t\n')).toBeUndefined();
    expect(normalizeBookSlug(undefined)).toBeUndefined();
  });

  it('rejects inputs containing control characters (U+0000..U+001F, U+007F)', () => {
    expect(normalizeBookSlug('slug\u0000test')).toBeUndefined();
    expect(normalizeBookSlug('slug\ntest')).toBeUndefined();
    expect(normalizeBookSlug('slug\rtest')).toBeUndefined();
    expect(normalizeBookSlug('slug\u001Ftest')).toBeUndefined();
    expect(normalizeBookSlug('slug\u007Ftest')).toBeUndefined();
  });

  it('decodes a literal percent (%25) once only without recursive decoding', () => {
    // "%25" is the encoded representation of a literal "%".
    // It should be decoded once to "%" and NOT re-decoded recursively.
    expect(normalizeBookSlug('book-%25-slug')).toBe('book-%-slug');
    expect(normalizeBookSlug('discount-50%25-off')).toBe('discount-50%-off');
    expect(normalizeBookSlug('%252')).toBe('%2');
  });

  it('trims leading and trailing whitespace around valid slugs', () => {
    expect(normalizeBookSlug('  my-book-slug  ')).toBe('my-book-slug');
  });
});
