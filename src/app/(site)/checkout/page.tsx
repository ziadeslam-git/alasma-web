import type { Metadata } from 'next';
import { CheckoutPage } from '@/modules/checkout';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <CheckoutPage />;
}
