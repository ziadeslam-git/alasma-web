import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdminTableDemo, type DemoState } from './admin-table-demo';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATES: readonly DemoState[] = ['ready', 'loading', 'error', 'empty'];

export default async function AdminTableDevPage({
  searchParams,
}: { searchParams?: Promise<{ state?: string }> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();

  const requested = (await searchParams)?.state;
  const state = STATES.find((item) => item === requested) ?? 'ready';

  return (
    <Suspense>
      <AdminTableDemo state={state} />
    </Suspense>
  );
}
