export const DEFAULT_SITE_URL = 'http://localhost:3000';

let hasWarnedMissingProductionSiteUrl = false;

export function resetSiteUrlWarningForTests() {
  hasWarnedMissingProductionSiteUrl = false;
}

function warnProductionSiteUrlOnce(reason: string) {
  if (hasWarnedMissingProductionSiteUrl) {
    return;
  }
  hasWarnedMissingProductionSiteUrl = true;
  console.warn(
    `[site] SITE_URL is ${reason} in production; falling back to ${DEFAULT_SITE_URL}. Set SITE_URL to the public https origin before deploying.`,
  );
}

/**
 * Returns the validated canonical site origin without a trailing slash.
 * Reads SITE_URL from the server environment only (never from request headers).
 */
export function getSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      warnProductionSiteUrlOnce('not set');
    }
    return DEFAULT_SITE_URL;
  }

  try {
    const parsed = new URL(raw);
    if (
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      Boolean(parsed.username) ||
      Boolean(parsed.password) ||
      Boolean(parsed.search) ||
      Boolean(parsed.hash)
    ) {
      if (process.env.NODE_ENV === 'production') {
        warnProductionSiteUrlOnce('invalid');
      }
      return DEFAULT_SITE_URL;
    }

    const basePath = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${basePath}`;
  } catch {
    if (process.env.NODE_ENV === 'production') {
      warnProductionSiteUrlOnce('invalid');
    }
    return DEFAULT_SITE_URL;
  }
}

function encodeSegmentSafely(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

/**
 * Joins a path with getSiteUrl() and percent-encodes each path segment safely
 * without double-encoding already percent-encoded segments.
 */
export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') {
    return `${base}/`;
  }

  const queryIndex = trimmed.indexOf('?');
  const rawPath = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  const rawQuery = queryIndex >= 0 ? trimmed.slice(queryIndex) : '';

  const segments = rawPath
    .split('/')
    .filter((segment) => segment.length > 0)
    .map(encodeSegmentSafely);

  const normalizedPath = segments.length > 0 ? `/${segments.join('/')}` : '/';
  return `${base}${normalizedPath}${rawQuery}`;
}
