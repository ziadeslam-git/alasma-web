const FILENAME_UTF8 = /filename\*\s*=\s*UTF-8''([^;]+)/i;
const FILENAME_PLAIN = /filename\s*=\s*"?([^";]+)"?/i;

// The file name from a Content-Disposition header, or null. Never trusts a path: only the last segment is kept.
export function filenameFromContentDisposition(header: string | null): string | null {
  if (header === null) return null;

  const encoded = FILENAME_UTF8.exec(header)?.[1];
  let name = FILENAME_PLAIN.exec(header)?.[1] ?? null;

  if (encoded !== undefined) {
    try {
      name = decodeURIComponent(encoded);
    } catch {
      // a malformed escape: fall back to the plain name
    }
  }

  const last = name?.split(/[\\/]/).pop()?.trim();

  return last ? last : null;
}

// Saves a Blob the user asked for (a receipt, an export) through a temporary link. The object URL lives for the click
// only and is neither stored nor logged.
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
