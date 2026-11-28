import { Suspense } from 'react';

import { AdminOrdersPage } from '@/modules/admin-orders';
import { AdminFrameSkeleton } from '@/modules/admin-shell';

// The list reads its filters from the URL (useSearchParams), so it sits inside Suspense.
export default function AdminOrdersRoute() {
  return (
    <Suspense fallback={<AdminFrameSkeleton />}>
      <AdminOrdersPage />
    </Suspense>
  );
}
