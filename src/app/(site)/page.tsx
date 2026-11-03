import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { getHomeData, HomeView } from '@/modules/home';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/modules/seo-site';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata, JsonLd } from '@/shared/seo';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: messages.home.meta.title,
  description: messages.home.meta.description,
  path: routes.home,
});

// Home page (ISR, 5 minutes). SiteShell owns the only <main>, so HomeView renders directly inside it.
export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />
      <HomeView data={data} />
    </>
  );
}
