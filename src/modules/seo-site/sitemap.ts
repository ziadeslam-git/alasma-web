import { isPageKey } from '@/modules/pages';
import {
  authorRoute,
  bookRoute,
  categoryRoute,
  routes,
  staticPageRoute,
} from '@/shared/config/routes';
import { absoluteUrl } from '@/shared/config/site';
import {
  createServerClient,
  nextFetch,
  throwIfError,
  type components,
  type ServerClientOptions,
} from '@/shared/lib/api';

export type SitemapData = components['schemas']['SitemapDto'];

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: string;
};

export const SITEMAP_REVALIDATE_SECONDS = 3600;
export const SITEMAP_CACHE_TAG = 'sitemap';
export const MAX_SITEMAP_URLS = 50_000;

export const STATIC_SITEMAP_PATHS = [
  routes.home,
  routes.books,
  routes.authors,
  routes.categories,
] as const;

/**
 * Fetches GET /api/v1/sitemap using the server client with ISR caching (revalidate 3600, tag "sitemap").
 * Throws on any non-2xx or network error so the sitemap route handler returns a 5xx response
 * and never serves an empty sitemap.
 */
export async function getSitemapData(options: ServerClientOptions = {}): Promise<SitemapData> {
  const client = createServerClient(options);
  const result = await client.GET('/api/v1/sitemap', {
    ...nextFetch({
      revalidate: SITEMAP_REVALIDATE_SECONDS,
      tags: [SITEMAP_CACHE_TAG],
    }),
  });

  if (result.error) {
    throwIfError(result);
  }

  if (!result.data) {
    throw new Error('Empty sitemap payload from API');
  }

  return result.data;
}

export function normalizeUtcTimestamp(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function collectSitemapEntries(data: SitemapData): SitemapUrlEntry[] {
  const entries: SitemapUrlEntry[] = [];

  for (const staticPath of STATIC_SITEMAP_PATHS) {
    entries.push({ loc: absoluteUrl(staticPath) });
  }

  for (const book of data.books) {
    const slug = book.slug.trim();
    if (!slug) {
      continue;
    }
    const lastmod = normalizeUtcTimestamp(book.updatedAt);
    entries.push({
      loc: absoluteUrl(bookRoute(slug)),
      ...(lastmod ? { lastmod } : {}),
    });
  }

  for (const author of data.authors) {
    const slug = author.slug.trim();
    if (!slug) {
      continue;
    }
    const lastmod = normalizeUtcTimestamp(author.updatedAt);
    entries.push({
      loc: absoluteUrl(authorRoute(slug)),
      ...(lastmod ? { lastmod } : {}),
    });
  }

  for (const category of data.categories) {
    const slug = category.slug.trim();
    if (!slug) {
      continue;
    }
    const lastmod = normalizeUtcTimestamp(category.updatedAt);
    entries.push({
      loc: absoluteUrl(categoryRoute(slug)),
      ...(lastmod ? { lastmod } : {}),
    });
  }

  for (const page of data.pages) {
    const key = page.key.trim();
    if (!isPageKey(key)) {
      continue;
    }
    const lastmod = normalizeUtcTimestamp(page.updatedAt);
    entries.push({
      loc: absoluteUrl(staticPageRoute(key)),
      ...(lastmod ? { lastmod } : {}),
    });
  }

  return entries;
}

export function chunkSitemapEntries(
  entries: readonly SitemapUrlEntry[],
  maxUrlsPerFile: number = MAX_SITEMAP_URLS,
): SitemapUrlEntry[][] {
  const chunkSize = Math.max(1, maxUrlsPerFile);
  if (entries.length === 0) {
    return [[]];
  }

  const chunks: SitemapUrlEntry[][] = [];
  for (let index = 0; index < entries.length; index += chunkSize) {
    chunks.push(entries.slice(index, index + chunkSize));
  }

  return chunks;
}

export function sitemapChunkPath(chunkIndex: number): string {
  return `/sitemap/${chunkIndex}.xml`;
}

export function parseSitemapChunkId(rawId: string | undefined): number | null {
  if (!rawId) {
    return null;
  }

  const normalized = rawId.endsWith('.xml') ? rawId.slice(0, -4) : rawId;
  if (!/^(?:0|[1-9]\d*)$/.test(normalized)) {
    return null;
  }

  const index = Number(normalized);
  return Number.isSafeInteger(index) && index >= 0 ? index : null;
}

export function buildSitemapIndexXml(chunks: readonly (readonly SitemapUrlEntry[])[]): string {
  const items = chunks
    .map((chunk, index) => {
      const loc = escapeXml(absoluteUrl(sitemapChunkPath(index)));
      let latestLastmod: string | undefined;
      for (const entry of chunk) {
        if (entry.lastmod && (!latestLastmod || entry.lastmod > latestLastmod)) {
          latestLastmod = entry.lastmod;
        }
      }
      const lastmodTag = latestLastmod ? `<lastmod>${escapeXml(latestLastmod)}</lastmod>` : '';
      return `<sitemap><loc>${loc}</loc>${lastmodTag}</sitemap>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}

export function buildSitemapChunkXml(entries: readonly SitemapUrlEntry[]): string {
  const urls = entries
    .map((entry) => {
      const loc = escapeXml(entry.loc);
      const lastmodTag = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmodTag}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
