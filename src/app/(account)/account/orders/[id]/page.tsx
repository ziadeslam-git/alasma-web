import type { Metadata } from 'next';
import { OrderDetails } from '@/modules/orders';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetails id={id} />;
}
