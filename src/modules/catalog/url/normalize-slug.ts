// Rejects ASCII control characters U+0000..U+001F and U+007F (DEL).
const controlCharacters = /[\u0000-\u001F\u007F]/;

/**
 * Normalizes a raw slug from route parameters:
 * - Decodes using decodeURIComponent exactly once, and only when raw contains '%'.
 * - If decodeURIComponent throws a URIError (e.g. malformed percent sequence), returns undefined (invalid).
 * - Trims leading and trailing whitespace.
 * - Rejects empty string or whitespace-only inputs.
 * - Rejects inputs containing control characters (U+0000..U+001F, U+007F).
 * - Rejects slugs longer than the supplied maximum.
 * - Enforces no alphabet restrictions (Arabic, Latin, digits, hyphens, and other valid UTF-8 characters are accepted).
 * - Decodes a literal '%' once only (e.g. "a%25b" becomes "a%b" and is not decoded again).
 *
 * Returns the normalized decoded slug string, or undefined if invalid.
 */
export function normalizeSlug(raw: string | undefined, maxLength: number): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }

  let decoded = raw;
  if (raw.includes('%')) {
    try {
      decoded = decodeURIComponent(raw);
    } catch (error) {
      if (error instanceof URIError) {
        return undefined;
      }
      throw error;
    }
  }

  const trimmed = decoded.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return undefined;
  }

  if (controlCharacters.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}
