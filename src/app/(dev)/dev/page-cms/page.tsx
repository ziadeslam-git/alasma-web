import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageView, type StaticPage } from '@/modules/pages';

import fixtures from './fixtures.json';

export const metadata: Metadata = {
  title: 'CMS page (dev)',
  robots: { index: false, follow: false },
};

// Realistic states for the CMS page view: ?state=normal (HTML), xss (attack attempt, must render safely),
// plain (no tags, like the seed pages) and empty. The older long and title-only states stay as aliases.
const states: Record<string, StaticPage> = {
  normal: fixtures.normal,
  xss: fixtures.xss,
  plain: fixtures.plain,
  empty: fixtures.empty,
  long: { ...fixtures.plain, body: `${fixtures.plain.body}\n\n${fixtures.plain.body}` },
  'title-only': { ...fixtures.empty },
};

export default async function DevPageCms({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const page = (typeof state === 'string' ? states[state] : undefined) ?? fixtures.normal;
  return (
    <main id="main-content">
      <PageView page={page} />
    </main>
  );
}
