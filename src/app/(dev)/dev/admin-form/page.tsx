import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdminFormDemo } from './admin-form-demo';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminFormDevPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return <AdminFormDemo />;
}
