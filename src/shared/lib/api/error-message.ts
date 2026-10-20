import messages from '@/i18n/messages/ar.json';

import type { ApiError } from './api-error';

type ApiErrorMessages = typeof messages.apiErrors;

const lookup = (table: Record<string, string>, key: string | undefined): string | undefined =>
  key === undefined ? undefined : table[key];

// The Arabic text for an error: the `code` first, then the HTTP status, then the kind (network, timeout), then a
// generic text. The tables live in src/i18n/messages/ar.json (apiErrors).
export function getApiErrorMessage(
  error: ApiError,
  table: ApiErrorMessages = messages.apiErrors,
): string {
  const byCode = lookup(table.codes, error.code) ?? lookup(table.adminCodes, error.code);

  if (byCode !== undefined) {
    return byCode;
  }

  const byStatus = lookup(
    table.status,
    error.status === undefined ? undefined : String(error.status),
  );

  if (byStatus !== undefined) {
    return byStatus;
  }

  if (error.status !== undefined && error.status >= 500) {
    return table.status['500'];
  }

  return lookup(table.kind, error.kind) ?? table.generic;
}
