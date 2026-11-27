import { describe, expect, it } from 'vitest';

import { buildQuery, parseQuery } from './build-query';
import { filenameFromContentDisposition } from './download-blob';
import { MULTIPART_JSON_FIELDS, asBlob, buildFormData, multipartOptions } from './multipart';
import { toRowVersion } from './row-version';

describe('toRowVersion', () => {
  it('passes a base64 string through and trims it', () => {
    expect(toRowVersion('AAAAAAAAB9E=')).toBe('AAAAAAAAB9E=');
    expect(toRowVersion('  AAAAAAAAB9E=  ')).toBe('AAAAAAAAB9E=');
  });

  it('encodes raw bytes as base64', () => {
    expect(toRowVersion(new Uint8Array([0, 0, 0, 0, 0, 0, 7, 209]))).toBe('AAAAAAAAB9E=');
    expect(toRowVersion(new Uint8Array([0, 0, 0, 0, 0, 0, 7, 209]).buffer)).toBe('AAAAAAAAB9E=');
  });

  it.each([null, undefined, '', '   ', 'not base64!', 'abc'])('throws for %j', (value) => {
    expect(() => toRowVersion(value)).toThrow(RangeError);
  });
});

describe('buildQuery and parseQuery', () => {
  const shape = {
    page: 'number',
    search: 'string',
    status: 'string[]',
    ids: 'number[]',
    isActive: 'boolean',
  } as const;

  it('sorts keys, repeats lists and leaves out empty values', () => {
    expect(
      buildQuery({
        status: ['Pending', 'Paid'],
        search: '  ',
        page: 2,
        isActive: false,
        from: null,
        to: undefined,
      }),
    ).toBe('isActive=false&page=2&status=Pending&status=Paid');
  });

  it('writes a Date as an ISO instant ending in Z and skips an invalid date', () => {
    expect(buildQuery({ from: new Date('2026-11-27T10:00:00Z') })).toBe(
      'from=2026-11-27T10%3A00%3A00.000Z',
    );
    expect(buildQuery({ from: new Date('nope') })).toBe('');
  });

  it('round trips: parse(build(state)) gives back the state', () => {
    const state = {
      page: 3,
      search: 'دار الأسمى & co',
      status: ['Pending', 'Paid'],
      ids: [4, 9],
      isActive: true,
    };

    expect(parseQuery(buildQuery(state), shape)).toEqual(state);
  });

  it('ignores a missing key and a value of the wrong type', () => {
    expect(parseQuery('page=abc&isActive=maybe&ids=1&ids=x', shape)).toEqual({ ids: [1] });
    expect(parseQuery(new URLSearchParams('search=x'), shape)).toEqual({ search: 'x' });
    expect(parseQuery('', shape)).toEqual({});
  });
});

describe('multipart', () => {
  it('writes scalars, dates and files, and leaves out null and undefined', () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    const form = buildFormData({
      title: 'Book',
      price: 12.5,
      isNew: false,
      startsAt: new Date('2026-11-27T10:00:00Z'),
      cover: file,
      isbn: null,
      language: undefined,
    });

    expect([...form.keys()].sort()).toEqual(['cover', 'isNew', 'price', 'startsAt', 'title']);
    expect(form.get('price')).toBe('12.5');
    expect(form.get('isNew')).toBe('false');
    expect(form.get('startsAt')).toBe('2026-11-27T10:00:00.000Z');
    expect((form.get('cover') as File).name).toBe('cover.png');
  });

  it('turns the contract JSON fields into JSON text', () => {
    const form = buildFormData(
      { title: 'Book', authors: [{ authorId: 1, order: 0 }], categories: [3, 4] },
      { jsonFields: MULTIPART_JSON_FIELDS.book },
    );

    expect(JSON.parse(String(form.get('authors')))).toEqual([{ authorId: 1, order: 0 }]);
    expect(JSON.parse(String(form.get('categories')))).toEqual([3, 4]);
    expect(form.get('title')).toBe('Book');

    const bundle = buildFormData(
      { items: [{ bookId: 5, quantity: 2 }] },
      { jsonFields: MULTIPART_JSON_FIELDS.bundle },
    );

    expect(JSON.parse(String(bundle.get('items')))).toEqual([{ bookId: 5, quantity: 2 }]);
  });

  it('refuses an object that is not listed as a JSON field', () => {
    expect(() => buildFormData({ authors: [1] })).toThrow(TypeError);
    expect(() => buildFormData({ meta: { a: 1 } })).toThrow('"meta"');
  });

  it('asBlob types a file for the generated body, and null stays null', () => {
    const file = new Blob(['x']);

    expect(asBlob(file)).toBe(file);
    expect(asBlob(null)).toBeNull();
    expect(asBlob(undefined)).toBeNull();
  });

  it('multipartOptions serializes the real FormData while the body stays a placeholder', () => {
    const form = new FormData();
    const options = multipartOptions({ photo: null }, form);

    expect(options.body).toEqual({ photo: null });
    expect(options.bodySerializer()).toBe(form);
  });
});

describe('filenameFromContentDisposition', () => {
  it('reads a plain, a quoted and an UTF-8 file name, and keeps the last path segment only', () => {
    expect(filenameFromContentDisposition('attachment; filename=receipt.pdf')).toBe('receipt.pdf');
    expect(filenameFromContentDisposition('attachment; filename="invoice 7.pdf"')).toBe(
      'invoice 7.pdf',
    );
    expect(
      filenameFromContentDisposition(
        "attachment; filename*=UTF-8''%D9%81%D8%A7%D8%AA%D9%88%D8%B1%D8%A9.pdf",
      ),
    ).toBe('فاتورة.pdf');
    expect(filenameFromContentDisposition('attachment; filename="../../etc/passwd"')).toBe(
      'passwd',
    );
  });

  it('returns null without a header or a name', () => {
    expect(filenameFromContentDisposition(null)).toBeNull();
    expect(filenameFromContentDisposition('inline')).toBeNull();
  });
});
