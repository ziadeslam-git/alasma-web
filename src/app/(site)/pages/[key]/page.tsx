import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { getPage, isPageKey, PageView } from '@/modules/pages';
import { staticPageRoute } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}
type PageProps = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { key } = await params;
  if (!isPageKey(key)) notFound();
  const result = await getPage(key);
  if (result.kind === 'notFound') notFound();
  return buildPageMetadata({
    title: result.page.title,
    description: messages.seo.defaultDescription,
    path: staticPageRoute(key),
  });
}

export default async function CmsPage({ params }: PageProps) {
  const { key } = await params;
  if (!isPageKey(key)) notFound();
  const result = await getPage(key);
  if (result.kind === 'notFound') notFound();
  return <PageView page={result.page} />;
}
