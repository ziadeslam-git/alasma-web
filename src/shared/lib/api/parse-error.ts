import { ApiError, type FieldErrors } from './api-error';

const textOf = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

function readFieldErrors(value: unknown): FieldErrors {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const result: FieldErrors = {};

  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((message): message is string => typeof message === 'string');
    }
  }

  return result;
}

// Retry-After is either a number of seconds or an HTTP date.
export function readRetryAfter(header: string | null, now: Date = new Date()): number | undefined {
  if (header === null || header.trim() === '') {
    return undefined;
  }

  const seconds = Number(header);

  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds));
  }

  const date = Date.parse(header);

  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - now.getTime()) / 1000));
}

async function readBody(response: Response): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(await response.text());

    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    // not JSON (a proxy error page, an empty body): the status alone is still useful
    return {};
  }
}

// A ProblemDetails-like body plus the status and headers of its response -> ApiError.
export function buildProblemError(status: number, body: unknown, headers: Headers): ApiError {
  const fields =
    typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  return new ApiError({
    kind: 'problem',
    status,
    type: textOf(fields.type),
    title: textOf(fields.title),
    detail: textOf(fields.detail),
    code: textOf(fields.code),
    traceId: textOf(fields.traceId),
    errors: readFieldErrors(fields.errors),
    retryAfterSeconds: status === 429 ? readRetryAfter(headers.get('Retry-After')) : undefined,
  });
}

// A failed HTTP response -> ApiError. Tolerates a non-JSON body and a ProblemDetails without `code`.
export async function parseResponseError(response: Response): Promise<ApiError> {
  return buildProblemError(response.status, await readBody(response), response.headers);
}

// Anything thrown instead of a response (no connection, timeout, abort) -> ApiError.
export function parseThrownError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // DOMException is not always an Error instance (jsdom), so read the name directly
  const name =
    typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : '';

  if (name === 'TimeoutError') {
    return new ApiError({ kind: 'timeout', cause: error });
  }

  if (error instanceof TypeError || name === 'AbortError') {
    return new ApiError({ kind: 'network', cause: error });
  }

  return new ApiError({ kind: 'unknown', cause: error });
}
