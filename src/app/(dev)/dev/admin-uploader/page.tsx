import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdminUploaderDemo } from './admin-uploader-demo';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminUploaderDevPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return <AdminUploaderDemo />;
}
