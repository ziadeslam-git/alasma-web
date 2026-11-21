import { getPaymentReceiptHtml } from '../api/payment-receipt-api';
import {
  openPrintablePage,
  PRINTABLE_URL_REVOKE_MS,
  PrintablePopupBlockedError,
} from './open-printable-page';

export const RECEIPT_URL_REVOKE_MS = PRINTABLE_URL_REVOKE_MS;
export { PrintablePopupBlockedError as ReceiptPopupBlockedError };

export function openPaymentReceipt(orderId: string, paymentId: string): Promise<void> {
  return openPrintablePage(() => getPaymentReceiptHtml(orderId, paymentId));
}
