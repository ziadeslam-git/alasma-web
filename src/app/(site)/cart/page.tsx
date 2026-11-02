import type { Metadata } from 'next';
import { RequireAuth } from '@/modules/auth';
import { CartPageClient } from '@/modules/cart';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function CartPage() {
  return (
    <RequireAuth>
      <CartPageClient />
    </RequireAuth>
  );
}
