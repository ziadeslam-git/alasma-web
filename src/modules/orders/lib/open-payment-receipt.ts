import { getPaymentReceiptHtml } from '../api/payment-receipt-api';

export const RECEIPT_URL_REVOKE_MS = 60_000;
const RECEIPT_MIME_TYPE = 'text/html;charset=utf-8';
const BLANK_TAB_URL = 'about:blank';
const NEW_TAB_TARGET = '_blank';

export class ReceiptPopupBlockedError extends Error {
  constructor() {
    super('Receipt tab was blocked');
    this.name = 'ReceiptPopupBlockedError';
  }
}

// The receipt page needs the Bearer token, so a plain link cannot open it. The blank tab is opened synchronously
// inside the click (a later window.open would be treated as a popup), the HTML is fetched by the client, and the
// tab then shows it from a Blob URL. The tab has no opener, and the URL is revoked after a minute. The token is
// never put in a URL or a storage.
export async function openPaymentReceipt(orderId: string, paymentId: string): Promise<void> {
  const tab = window.open(BLANK_TAB_URL, NEW_TAB_TARGET);
  if (!tab) throw new ReceiptPopupBlockedError();
  tab.opener = null;
  try {
    const html = await getPaymentReceiptHtml(orderId, paymentId);
    const url = URL.createObjectURL(new Blob([html], { type: RECEIPT_MIME_TYPE }));
    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), RECEIPT_URL_REVOKE_MS);
  } catch (error) {
    tab.close();
    throw error;
  }
}
