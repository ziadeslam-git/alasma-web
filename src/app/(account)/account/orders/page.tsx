import type { Metadata } from 'next';
import { OrdersList, type OrderStatus } from '@/modules/orders';
import { MAX_PAGE } from '@/modules/catalog';

export const metadata: Metadata = { robots: { index: false, follow: false } };
const statuses: readonly OrderStatus[] = [
  'PendingPayment',
  'PaymentReview',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const query = await searchParams;
  const n = Number(query.page);
  const page = Number.isInteger(n) && n >= 1 && n <= MAX_PAGE ? n : 1;
  const status = statuses.find((item) => item === query.status);
  return <OrdersList key={`${status ?? ''}-${page}`} page={page} status={status} />;
}
