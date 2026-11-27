import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdminDialogsDemo, type DemoBar } from './admin-dialogs-demo';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const BAR: readonly DemoBar[] = ['clean', 'dirty', 'saving'];

export default async function AdminDialogsDevPage({
  searchParams,
}: { searchParams?: Promise<{ bar?: string }> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();

  const requested = (await searchParams)?.bar;
  const bar = BAR.find((item) => item === requested) ?? 'clean';

  return <AdminDialogsDemo initialBar={bar} />;
}
