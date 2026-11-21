import messages from '@/i18n/messages/ar.json';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { PrintablePopupBlockedError } from './open-printable-page';

const NOT_FOUND_STATUS = 404;
// The 404 codes the API gives for a missing order or payment. A closed backend flag (Orders.InvoicePrint) is also a
// 404, but with NO such code, so the two are told apart by the code of the error body.
const MISSING_RESOURCE_CODES: readonly string[] = ['order_not_found', 'payment_not_found'];

// A 404 without a "not found" code is the closed flag: "not available right now", never "order not found". A 404 that
// names the missing order or payment, and every other API error, keep their own Arabic text; anything unknown is
// "not available".
export function printableErrorMessage(cause: unknown, unavailableText: string): string {
  if (cause instanceof PrintablePopupBlockedError) return messages.orders.receiptPopupBlocked;
  if (cause instanceof ApiError) {
    const isFlagLocked =
      cause.status === NOT_FOUND_STATUS && !MISSING_RESOURCE_CODES.includes(cause.code ?? '');

    return isFlagLocked ? unavailableText : getApiErrorMessage(cause);
  }

  return unavailableText;
}
