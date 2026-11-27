import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminGate } from '@/modules/admin-shell';

// Never indexed and never served from a cache: every request is rendered fresh, and the gate itself is a Client
// Component, so a layout cannot be one (it exports metadata).
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
