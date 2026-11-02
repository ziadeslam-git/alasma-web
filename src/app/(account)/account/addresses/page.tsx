import type { Metadata } from 'next';
import { AddressesView } from '@/modules/addresses';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function AddressesPage() {
  return <AddressesView />;
}
