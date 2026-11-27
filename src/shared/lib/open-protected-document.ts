export const PROTECTED_DOCUMENT_REVOKE_MS = 60_000;

const HTML_MIME_TYPE = 'text/html;charset=utf-8';
const BLANK_TAB_URL = 'about:blank';
const NEW_TAB_TARGET = '_blank';
const SAFE_LINK = /^https?:\/\//i;

export class ProtectedDocumentPopupBlockedError extends Error {
  constructor() {
    super('Document tab was blocked');
    this.name = 'ProtectedDocumentPopupBlockedError';
  }
}

export class UnsafeSignedUrlError extends Error {
  constructor() {
    super('The signed link is not an http(s) address');
    this.name = 'UnsafeSignedUrlError';
  }
}

// What a loader may return: ready HTML (invoice, receipt) or a Blob (a PDF, an image).
export type ProtectedDocumentContent = string | Blob;

// Opens the blank tab inside the click itself. A window.open that runs after an await is treated as a popup and is
// blocked. The tab has no opener.
function openBlankTab(): Window {
  const tab = window.open(BLANK_TAB_URL, NEW_TAB_TARGET);
  if (!tab) throw new ProtectedDocumentPopupBlockedError();
  tab.opener = null;

  return tab;
}

function toBlob(content: ProtectedDocumentContent): Blob {
  return typeof content === 'string' ? new Blob([content], { type: HTML_MIME_TYPE }) : content;
}

// A document that needs the Bearer token cannot be a plain link. The tab is opened synchronously with the click, the
// loader (which carries the token) fetches the content, and the tab then shows it from a Blob URL that is revoked
// after a minute. The token is never put in a URL or a storage, and the content is never injected into this page.
export async function openProtectedDocument(
  load: () => Promise<ProtectedDocumentContent>,
): Promise<void> {
  const tab = openBlankTab();

  try {
    const url = URL.createObjectURL(toBlob(await load()));

    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), PROTECTED_DOCUMENT_REVOKE_MS);
  } catch (error) {
    tab.close();
    throw error;
  }
}

// A short-lived signed link (payment proof, manuscript). It is asked for at the click, opened in a tab without an
// opener and dropped: never stored, never logged, never part of an error text. Only http(s) is accepted.
export async function openSignedUrl(fetchLink: () => Promise<{ url: string }>): Promise<void> {
  const tab = openBlankTab();

  try {
    const { url } = await fetchLink();

    if (!SAFE_LINK.test(url)) throw new UnsafeSignedUrlError();
    tab.location.href = url;
  } catch (error) {
    tab.close();
    throw error;
  }
}
