export const PRINTABLE_URL_REVOKE_MS = 60_000;
const PRINTABLE_MIME_TYPE = 'text/html;charset=utf-8';
const BLANK_TAB_URL = 'about:blank';
const NEW_TAB_TARGET = '_blank';

export class PrintablePopupBlockedError extends Error {
  constructor() {
    super('Printable tab was blocked');
    this.name = 'PrintablePopupBlockedError';
  }
}

// Printable pages (receipt, invoice) need the Bearer token, so a plain link cannot open them. The blank tab is opened
// synchronously inside the click (a later window.open would be treated as a popup), the HTML is fetched by the
// client, and the tab then shows it from a Blob URL. The tab has no opener, and the URL is revoked after a minute.
// The token is never put in a URL or a storage, and the HTML is never injected into this page.
export async function openPrintablePage(loadHtml: () => Promise<string>): Promise<void> {
  const tab = window.open(BLANK_TAB_URL, NEW_TAB_TARGET);
  if (!tab) throw new PrintablePopupBlockedError();
  tab.opener = null;
  try {
    const html = await loadHtml();
    const url = URL.createObjectURL(new Blob([html], { type: PRINTABLE_MIME_TYPE }));
    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), PRINTABLE_URL_REVOKE_MS);
  } catch (error) {
    tab.close();
    throw error;
  }
}
