import { describe, expect, it } from 'vitest';

import { getPlainBodyParagraphs } from './plain-body';

describe('getPlainBodyParagraphs', () => {
  it('keeps single line breaks and splits blank lines', () => {
    expect(getPlainBodyParagraphs('one\ntwo\n\n\nthree\n \n four  ')).toEqual([
      'one\ntwo',
      'three',
      'four',
    ]);
  });
  it('rejects markup and empty content', () => {
    expect(getPlainBodyParagraphs('')).toEqual([]);
    expect(getPlainBodyParagraphs(' \n ')).toEqual([]);
    expect(getPlainBodyParagraphs('text < markup')).toEqual([]);
  });
  it('retains entity-like text literally', () => {
    expect(getPlainBodyParagraphs('A &amp; B')).toEqual(['A &amp; B']);
  });
});
