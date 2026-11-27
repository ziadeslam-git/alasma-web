import messages from '@/i18n/messages/ar.json';

import { ApiError, type FieldErrors } from '../../api-error';
import { ADMIN_ERROR_CODES, isConcurrencyCode } from './admin-error-codes';

// What a screen needs to react to a failed admin call, in one shape for every endpoint:
// - conflict: somebody else changed it. Reload the row, keep the user's edits visible.
// - retry: a transient clash. The same call may be sent again after `retryAfter` seconds.
// - validation: show `fieldErrors` next to the form fields.
// - business: the request was understood but a rule refused it (422, or a 409 that is not a stale row).
export type AdminErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'retry'
  | 'business'
  | 'too_large'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'timeout'
  | 'unknown';

export type MappedAdminError = {
  kind: AdminErrorKind;
  // A dotted path inside ar.json (for example `apiErrors.adminCodes.books_isbn_taken`). Resolve it with
  // getAdminErrorMessage.
  messageKey: string;
  // Field name (camelCase, like the request body) -> the messages the API sent. Empty unless kind is validation.
  fieldErrors: FieldErrors;
  // Seconds to wait before the same call may be sent again (kind retry or rate_limited).
  retryAfter?: number;
  status?: number;
  code?: string;
  // The id to quote to support, when the backend sent one.
  correlationId?: string;
};

const DEFAULT_RETRY_SECONDS = 1;
const KIND_KEY_PREFIX = 'apiErrors.admin.kinds.';

const adminCodes: Record<string, string> = messages.apiErrors.adminCodes;
const sharedCodes: Record<string, string> = messages.apiErrors.codes;

// The API serializes field names as the .NET model has them (`Title`, `Items[0].BookId`); the forms use camelCase.
export function normalizeFieldName(name: string): string {
  return name
    .split('.')
    .map((part) => (part.length > 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part))
    .join('.');
}

function normalizeFieldErrors(errors: FieldErrors): FieldErrors {
  const result: FieldErrors = {};

  for (const [field, texts] of Object.entries(errors)) {
    const key = normalizeFieldName(field);

    result[key] = [...(result[key] ?? []), ...texts];
  }

  return result;
}

function kindOfProblem(error: ApiError): AdminErrorKind {
  const { status, code } = error;

  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 413) return 'too_large';
  if (status === 429) return 'rate_limited';
  if (status === 400) return 'validation';
  if (status === 409) {
    if (code === ADMIN_ERROR_CODES.transientConflict) return 'retry';

    return isConcurrencyCode(code) ? 'conflict' : 'business';
  }
  if (status === 422) return 'business';
  if (status !== undefined && status >= 500) return 'server';

  return 'unknown';
}

// A code with its own Arabic text wins; otherwise the text of the kind. Returns null for a code with no text.
function messageKeyOfCode(code: string | undefined): string | null {
  if (code === undefined) return null;
  if (code in adminCodes) return `apiErrors.adminCodes.${code}`;
  if (code in sharedCodes) return `apiErrors.codes.${code}`;

  return null;
}

// Development only, and only the code and status (never a message, a URL or a body, which may hold personal data).
function reportUnknownCode(error: ApiError) {
  if (process.env.NODE_ENV === 'production') return;

  console.warn(
    `[admin-api] no Arabic text for the error code "${error.code}" (HTTP ${error.status})`,
  );
}

// Translates anything an admin call can throw into one shape. It decides by status and `code`, never by `message`.
export function mapApiError(error: unknown): MappedAdminError {
  if (!(error instanceof ApiError)) {
    return { kind: 'unknown', messageKey: `${KIND_KEY_PREFIX}unknown`, fieldErrors: {} };
  }

  if (error.kind === 'network' || error.kind === 'timeout') {
    return { kind: error.kind, messageKey: `${KIND_KEY_PREFIX}${error.kind}`, fieldErrors: {} };
  }

  const kind = error.kind === 'problem' ? kindOfProblem(error) : 'unknown';
  const codeKey = messageKeyOfCode(error.code);
  const isKnownPattern = isConcurrencyCode(error.code) || error.code === undefined;

  if (codeKey === null && !isKnownPattern) {
    reportUnknownCode(error);
  }

  const hasRetry = kind === 'retry' || kind === 'rate_limited';

  return {
    kind,
    messageKey: codeKey ?? `${KIND_KEY_PREFIX}${kind}`,
    fieldErrors: kind === 'validation' ? normalizeFieldErrors(error.errors) : {},
    retryAfter: hasRetry ? (error.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS) : undefined,
    status: error.status,
    code: error.code,
    correlationId: error.correlationId,
  };
}

// The Arabic text behind a messageKey ('apiErrors.adminCodes.books_isbn_taken' -> the sentence).
export function getAdminErrorMessage(messageKey: string): string {
  let node: unknown = messages;

  for (const part of messageKey.split('.')) {
    node =
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined;
  }

  return typeof node === 'string' ? node : messages.apiErrors.generic;
}
