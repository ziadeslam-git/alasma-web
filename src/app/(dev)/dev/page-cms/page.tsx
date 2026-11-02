import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { PageView, type StaticPage } from '@/modules/pages';

export const metadata: Metadata = {
  title: 'CMS page (dev)',
  robots: { index: false, follow: false },
};

export default async function DevPageCms({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const text = messages.devPageCms;
  const page: StaticPage = {
    key: 'about',
    title: state === 'long' ? text.long : state === 'empty' ? text.empty : text.normal,
    body:
      state === 'markup'
        ? `<p>${text.body}</p>`
        : state === 'empty' || state === 'title-only'
          ? ''
          : state === 'long'
            ? `${text.body}\n\n${text.body}`
            : text.body,
  };
  return (
    <main id="main-content">
      <PageView page={page} />
    </main>
  );
}
