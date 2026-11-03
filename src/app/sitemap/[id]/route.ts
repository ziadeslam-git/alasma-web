import {
  buildSitemapChunkXml,
  chunkSitemapEntries,
  collectSitemapEntries,
  getSitemapData,
  parseSitemapChunkId,
} from '@/modules/seo-site';

export const dynamic = 'force-dynamic';

type SitemapChunkRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: SitemapChunkRouteProps) {
  let rawId: string | undefined;
  try {
    rawId = (await params).id;
  } catch {
    return new Response('Not Found', { status: 404 });
  }

  const chunkIndex = parseSitemapChunkId(rawId);
  if (chunkIndex === null) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const data = await getSitemapData();
    const entries = collectSitemapEntries(data);
    const chunks = chunkSitemapEntries(entries);
    const chunk = chunks[chunkIndex];

    if (!chunk) {
      return new Response('Not Found', { status: 404 });
    }

    const xml = buildSitemapChunkXml(chunk);
    return new Response(xml, {
      status: 200,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }
}
