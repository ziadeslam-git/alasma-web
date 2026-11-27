import {
  openProtectedDocument,
  PROTECTED_DOCUMENT_REVOKE_MS,
  ProtectedDocumentPopupBlockedError,
} from '@/shared/lib/open-protected-document';

export const PRINTABLE_URL_REVOKE_MS = PROTECTED_DOCUMENT_REVOKE_MS;

// Kept under the old names so the order screens and their tests do not change: the logic lives in the shared helper.
export { ProtectedDocumentPopupBlockedError as PrintablePopupBlockedError };

export function openPrintablePage(loadHtml: () => Promise<string>): Promise<void> {
  return openProtectedDocument(loadHtml);
}
