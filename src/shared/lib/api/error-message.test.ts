import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { ApiError } from './api-error';
import { getApiErrorMessage } from './error-message';

const table = messages.apiErrors;
const arabic = /[؀-ۿ]/;

describe('getApiErrorMessage', () => {
  it('uses the message of the code first', () => {
    const error = new ApiError({ kind: 'problem', status: 404, code: 'catalog_book_not_found' });

    expect(getApiErrorMessage(error)).toBe(table.codes.catalog_book_not_found);
    expect(getApiErrorMessage(error)).not.toBe(table.status['404']);
  });

  it('finds an admin code too', () => {
    const error = new ApiError({ kind: 'problem', status: 409, code: 'authors_has_books' });

    expect(getApiErrorMessage(error)).toBe(table.adminCodes.authors_has_books);
  });

  it('falls back to the status message when the code is unknown or missing', () => {
    const unknown = new ApiError({ kind: 'problem', status: 403, code: 'brand_new_code' });
    const missing = new ApiError({ kind: 'problem', status: 429 });

    expect(getApiErrorMessage(unknown)).toBe(table.status['403']);
    expect(getApiErrorMessage(missing)).toBe(table.status['429']);
  });

  it('uses the server-error text for any 5xx', () => {
    expect(getApiErrorMessage(new ApiError({ kind: 'problem', status: 502 }))).toBe(
      table.status['500'],
    );
  });

  it('has a message for a network failure, a timeout and an unknown error', () => {
    expect(getApiErrorMessage(new ApiError({ kind: 'network' }))).toBe(table.kind.network);
    expect(getApiErrorMessage(new ApiError({ kind: 'timeout' }))).toBe(table.kind.timeout);
    expect(getApiErrorMessage(new ApiError({ kind: 'unknown' }))).toBe(table.generic);
  });

  it('gives every message as non-empty Arabic text', () => {
    const all = [
      ...Object.values(table.codes),
      ...Object.values(table.adminCodes),
      ...Object.values(table.status),
      ...Object.values(table.kind),
      table.generic,
    ];

    expect(all.length).toBeGreaterThan(100);
    expect(all.every((text) => arabic.test(text))).toBe(true);
  });

  it('uses unique lower_snake keys for every code', () => {
    const keys = [...Object.keys(table.codes), ...Object.keys(table.adminCodes)];

    expect(keys.every((key) => /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(key))).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
