import type { Metadata } from 'next';
import { OrderSuccess } from '@/modules/checkout';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderSuccess id={orderId} />;
}
