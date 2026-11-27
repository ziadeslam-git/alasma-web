// The error codes the admin screens treat specially. Every code is a lower_snake string of the API contract;
// the screens branch on these, never on the text of a message.
export const ADMIN_ERROR_CODES = {
  // 400
  requestInvalid: 'request_invalid',
  // 403 about the account, not about a permission
  emailNotConfirmed: 'email_not_confirmed',
  // 403 a switched-off feature
  featureDisabled: 'feature_disabled',
  // 409: somebody else changed the row (stale rowVersion)
  concurrencyConflict: 'concurrency_conflict',
  orderConcurrencyConflict: 'order_concurrency_conflict',
  // 409: settings use a rowVersion per key, so a clash is a stale row too
  settingsConflict: 'settings_conflict',
  // 409 with Retry-After: the same call is safe to send again
  transientConflict: 'transient_conflict',
  // 413
  requestTooLarge: 'request_too_large',
} as const;

const CONCURRENCY_SUFFIX = '_concurrency_conflict';

// `concurrency_conflict`, `order_concurrency_conflict`, `authors_concurrency_conflict`, `books_concurrency_conflict`...
export function isConcurrencyCode(code: string | undefined): boolean {
  return (
    code === ADMIN_ERROR_CODES.concurrencyConflict ||
    code === ADMIN_ERROR_CODES.settingsConflict ||
    (code !== undefined && code.endsWith(CONCURRENCY_SUFFIX))
  );
}
