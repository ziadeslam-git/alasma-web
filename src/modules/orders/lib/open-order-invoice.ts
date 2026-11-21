import { getOrderInvoiceHtml } from '../api/order-invoice-api';
import { openPrintablePage } from './open-printable-page';

export function openOrderInvoice(orderId: string): Promise<void> {
  return openPrintablePage(() => getOrderInvoiceHtml(orderId));
}
