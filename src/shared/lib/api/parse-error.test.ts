import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';
import { parseResponseError, parseThrownError, readRetryAfter } from './parse-error';

const problem = (status: number, body: unknown, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json', ...headers },
  });

describe('parseResponseError', () => {
  it('reads the ProblemDetails fields and the code', async () => {
    const error = await parseResponseError(
      problem(404, {
        type: 'https://example/404',
        title: 'Not Found',
        status: 404,
        detail: 'The book does not exist.',
        code: 'catalog_book_not_found',
        traceId: 'abc',
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'problem',
      status: 404,
      code: 'catalog_book_not_found',
      title: 'Not Found',
      detail: 'The book does not exist.',
      traceId: 'abc',
    });
  });

  it('exposes validation errors as a map of field name to messages', async () => {
    const error = await parseResponseError(
      problem(400, {
        title: 'Bad Request',
        errors: { email: ['required', 'invalid'], password: ['short'] },
      }),
    );

    expect(error.isValidation).toBe(true);
    expect(error.errors).toEqual({ email: ['required', 'invalid'], password: ['short'] });
    expect(error.code).toBeUndefined();
  });

  it('copes with a ProblemDetails that has no code', async () => {
    const error = await parseResponseError(problem(409, { title: 'Conflict' }));

    expect(error).toMatchObject({ status: 409, title: 'Conflict', code: undefined });
    expect(error.errors).toEqual({});
  });

  it('copes with a body that is not JSON', async () => {
    const error = await parseResponseError(
      new Response('<html>Bad gateway</html>', { status: 502 }),
    );

    expect(error).toMatchObject({
      kind: 'problem',
      status: 502,
      code: undefined,
      title: undefined,
    });
  });

  it('copes with an empty body', async () => {
    const error = await parseResponseError(new Response(null, { status: 500 }));

    expect(error.status).toBe(500);
  });

  it('reads Retry-After in seconds for a 429', async () => {
    const error = await parseResponseError(
      problem(429, { title: 'Too Many Requests' }, { 'Retry-After': '17' }),
    );

    expect(error.retryAfterSeconds).toBe(17);
  });

  it('ignores Retry-After on other statuses', async () => {
    const error = await parseResponseError(problem(503, {}, { 'Retry-After': '17' }));

    expect(error.retryAfterSeconds).toBeUndefined();
  });
});

describe('readRetryAfter', () => {
  it('reads an HTTP date relative to now', () => {
    const now = new Date('2026-10-20T10:00:00Z');

    expect(readRetryAfter('Tue, 20 Oct 2026 10:00:30 GMT', now)).toBe(30);
  });

  it('returns undefined for a missing or unreadable header', () => {
    expect(readRetryAfter(null)).toBeUndefined();
    expect(readRetryAfter('soon')).toBeUndefined();
  });
});

describe('parseThrownError', () => {
  it('turns a fetch failure into a network error', () => {
    expect(parseThrownError(new TypeError('fetch failed')).kind).toBe('network');
  });

  it('turns a timeout into a timeout error', () => {
    const timeout = new DOMException('signal timed out', 'TimeoutError');

    expect(parseThrownError(timeout).kind).toBe('timeout');
  });

  it('keeps an ApiError as it is and marks anything else unknown', () => {
    const existing = new ApiError({ kind: 'problem', status: 400 });

    expect(parseThrownError(existing)).toBe(existing);
    expect(parseThrownError('boom').kind).toBe('unknown');
  });
});
