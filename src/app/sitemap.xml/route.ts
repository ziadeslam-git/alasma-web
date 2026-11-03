import {
  buildSitemapIndexXml,
  chunkSitemapEntries,
  collectSitemapEntries,
  getSitemapData,
} from '@/modules/seo-site';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getSitemapData();
    const entries = collectSitemapEntries(data);
    const chunks = chunkSitemapEntries(entries);
    const xml = buildSitemapIndexXml(chunks);

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
