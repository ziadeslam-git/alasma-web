import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { getPackages, PublishView } from '@/modules/publishing';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

// The packages are public and cached for an hour by the API; the page is ISR. The request form reads the customer's
// session in the browser.
// Next reads this value at build time, so it must be a literal (it equals PACKAGES_REVALIDATE_SECONDS).
export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: messages.publishing.meta.title,
  description: messages.publishing.meta.description,
  path: routes.publish,
});

export default async function PublishPage() {
  const result = await getPackages();
  return <PublishView result={result} />;
}
