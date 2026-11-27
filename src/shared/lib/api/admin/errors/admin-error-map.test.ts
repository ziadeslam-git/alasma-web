import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { ApiError } from '../../api-error';
import { buildProblemError } from '../../parse-error';
import { ADMIN_ERROR_CODES, isConcurrencyCode } from './admin-error-codes';
import { getAdminErrorMessage, mapApiError, normalizeFieldName } from './admin-error-map';

// Bodies shaped like the real ProblemDetails of the API: type, title, status, code, plus the traceId and
// correlationId extension members.
function problem(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return buildProblemError(
    status,
    { type: 'https://httpstatuses.io/' + status, status, traceId: '00-abc-01', ...body },
    new Headers(headers),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mapApiError by kind', () => {
  it('400 request_invalid -> validation with the fields in camelCase', () => {
    const mapped = mapApiError(
      problem(400, {
        title: 'One or more validation errors occurred.',
        code: ADMIN_ERROR_CODES.requestInvalid,
        errors: { Title: ['The Title field is required.'], 'Items[0].BookId': ['Invalid.'] },
      }),
    );

    expect(mapped.kind).toBe('validation');
    expect(mapped.messageKey).toBe('apiErrors.codes.request_invalid');
    expect(mapped.fieldErrors).toEqual({
      title: ['The Title field is required.'],
      'items[0].bookId': ['Invalid.'],
    });
    expect(mapped.retryAfter).toBeUndefined();
  });

  it('401 -> unauthenticated, 403 -> forbidden, 404 -> not_found', () => {
    // the framework answers a missing token or permission without a `code`
    expect(mapApiError(problem(401, { title: 'Unauthorized' })).kind).toBe('unauthenticated');
    expect(mapApiError(problem(403, { title: 'Forbidden' })).kind).toBe('forbidden');
    expect(mapApiError(problem(403, { code: ADMIN_ERROR_CODES.featureDisabled }))).toMatchObject({
      kind: 'forbidden',
      messageKey: 'apiErrors.codes.feature_disabled',
    });
    expect(mapApiError(problem(404, { code: 'order_not_found' }))).toMatchObject({
      kind: 'not_found',
      messageKey: 'apiErrors.codes.order_not_found',
    });
  });

  it('403 email_not_confirmed keeps its own text (account, not permission)', () => {
    const mapped = mapApiError(problem(403, { code: ADMIN_ERROR_CODES.emailNotConfirmed }));

    expect(mapped.kind).toBe('forbidden');
    expect(mapped.messageKey).toBe('apiErrors.codes.email_not_confirmed');
  });

  it.each([
    ['order_concurrency_conflict', 'apiErrors.codes.order_concurrency_conflict'],
    ['books_concurrency_conflict', 'apiErrors.adminCodes.books_concurrency_conflict'],
    ['authors_concurrency_conflict', 'apiErrors.adminCodes.authors_concurrency_conflict'],
    ['concurrency_conflict', 'apiErrors.admin.kinds.conflict'],
    ['coupons_concurrency_conflict', 'apiErrors.admin.kinds.conflict'],
    ['settings_conflict', 'apiErrors.adminCodes.settings_conflict'],
  ])('409 %s -> conflict', (code, key) => {
    const mapped = mapApiError(problem(409, { code }));

    expect(mapped.kind).toBe('conflict');
    expect(mapped.messageKey).toBe(key);
    expect(mapped.retryAfter).toBeUndefined();
  });

  it('409 transient_conflict -> retry with Retry-After from the header', () => {
    const mapped = mapApiError(
      problem(409, { code: ADMIN_ERROR_CODES.transientConflict }, { 'Retry-After': '3' }),
    );

    expect(mapped).toMatchObject({ kind: 'retry', retryAfter: 3 });
  });

  it('409 transient_conflict without the header -> retry after one second', () => {
    expect(mapApiError(problem(409, { code: 'transient_conflict' })).retryAfter).toBe(1);
  });

  it('409 that is not a stale row (slug taken) -> business, with its own text', () => {
    const mapped = mapApiError(problem(409, { code: 'books_isbn_taken' }));

    expect(mapped.kind).toBe('business');
    expect(mapped.messageKey).toBe('apiErrors.adminCodes.books_isbn_taken');
  });

  it('413 request_too_large -> too_large', () => {
    expect(mapApiError(problem(413, { code: ADMIN_ERROR_CODES.requestTooLarge }))).toMatchObject({
      kind: 'too_large',
      messageKey: 'apiErrors.codes.request_too_large',
    });
  });

  it('422 -> business, text by code', () => {
    expect(mapApiError(problem(422, { code: 'stock_insufficient' }))).toMatchObject({
      kind: 'business',
      messageKey: 'apiErrors.adminCodes.stock_insufficient',
    });
  });

  it('429 -> rate_limited with retryAfter from the header (seconds or a date)', () => {
    expect(mapApiError(problem(429, {}, { 'Retry-After': '30' }))).toMatchObject({
      kind: 'rate_limited',
      retryAfter: 30,
      messageKey: 'apiErrors.admin.kinds.rate_limited',
    });
  });

  it('5xx -> server, and carries the correlation id from the body', () => {
    const mapped = mapApiError(
      problem(500, { title: 'An error occurred', correlationId: 'c0ffee-1' }),
    );

    expect(mapped).toMatchObject({ kind: 'server', correlationId: 'c0ffee-1', status: 500 });
  });

  it('network and timeout failures keep their kind', () => {
    expect(mapApiError(new ApiError({ kind: 'network' })).kind).toBe('network');
    expect(mapApiError(new ApiError({ kind: 'timeout' })).messageKey).toBe(
      'apiErrors.admin.kinds.timeout',
    );
  });

  it('anything that is not an ApiError -> unknown', () => {
    expect(mapApiError(new Error('boom'))).toMatchObject({
      kind: 'unknown',
      messageKey: 'apiErrors.admin.kinds.unknown',
    });
    expect(mapApiError(undefined).kind).toBe('unknown');
  });
});

describe('codes, not messages', () => {
  it('ignores the title and detail text: only the code decides the message', () => {
    const mapped = mapApiError(
      problem(409, {
        title: 'The order was changed by another user',
        detail: 'concurrency_conflict',
        code: 'transient_conflict',
      }),
    );

    expect(mapped.kind).toBe('retry');
  });

  it('an unknown code gets the kind message and a dev-only log with the code and status only', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mapped = mapApiError(
      problem(422, { code: 'brand_new_rule', title: 'Secret customer name: Ahmed' }),
    );

    expect(mapped).toMatchObject({
      kind: 'business',
      messageKey: 'apiErrors.admin.kinds.business',
    });
    expect(warn).toHaveBeenCalledTimes(1);

    const logged = String(warn.mock.calls[0]?.[0]);

    expect(logged).toContain('brand_new_rule');
    expect(logged).toContain('422');
    expect(logged).not.toContain('Ahmed');
  });

  it('does not log a problem with no code, or a concurrency code with no own text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mapApiError(problem(500, {}));
    mapApiError(problem(409, { code: 'coupons_concurrency_conflict' }));

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not log in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mapApiError(problem(422, { code: 'brand_new_rule' }));

    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe('isConcurrencyCode and field names', () => {
  it('recognizes the general and the per-resource concurrency codes only', () => {
    expect(isConcurrencyCode('concurrency_conflict')).toBe(true);
    expect(isConcurrencyCode('order_concurrency_conflict')).toBe(true);
    expect(isConcurrencyCode('settings_conflict')).toBe(true);
    expect(isConcurrencyCode('transient_conflict')).toBe(false);
    expect(isConcurrencyCode('concurrency_conflict_extra')).toBe(false);
    expect(isConcurrencyCode(undefined)).toBe(false);
  });

  it('lowers the first letter of every path part', () => {
    expect(normalizeFieldName('Title')).toBe('title');
    expect(normalizeFieldName('Items[0].BookId')).toBe('items[0].bookId');
    expect(normalizeFieldName('')).toBe('');
  });
});

describe('getAdminErrorMessage', () => {
  it('resolves a messageKey to the Arabic text, and falls back to the generic text', () => {
    expect(getAdminErrorMessage('apiErrors.admin.kinds.conflict')).toBe(
      messages.apiErrors.admin.kinds.conflict,
    );
    expect(getAdminErrorMessage('apiErrors.adminCodes.books_isbn_taken')).toBe(
      messages.apiErrors.adminCodes.books_isbn_taken,
    );
    expect(getAdminErrorMessage('apiErrors.nope.missing')).toBe(messages.apiErrors.generic);
  });

  it('has a text for every kind the mapper can return', () => {
    for (const kind of Object.keys(messages.apiErrors.admin.kinds)) {
      expect(getAdminErrorMessage(`apiErrors.admin.kinds.${kind}`)).not.toBe(
        messages.apiErrors.generic,
      );
    }
  });
});
