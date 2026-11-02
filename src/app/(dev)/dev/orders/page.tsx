import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import messages from '@/i18n/messages/ar.json';
import { OrderDetails, OrdersList, type Order, type OrderList } from '@/modules/orders';

export const metadata: Metadata = { robots: { index: false, follow: false } };
const statuses = [
  'PendingPayment',
  'PaymentReview',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;
const id = '12345678-1234-1234-1234-123456789abc';
const createdAt = '2026-01-15T10:00:00Z';

export default async function DevOrdersPage({
  searchParams,
}: { searchParams?: Promise<{ state?: string }> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const items = statuses.map((status, index) => ({
    id: `${String(index + 1).padStart(8, '0')}-1234-1234-1234-123456789abc`,
    orderNumber: `ORD-${index + 1}`,
    status,
    total: 100,
    itemsCount: 1,
    createdAt,
    canCancel: index < 3,
  }));
  const list: OrderList = { items, page: 1, pageSize: 48, totalCount: items.length };
  const order: Order = {
    id,
    orderNumber: 'ORD-1',
    status: state === 'zone-locked' ? 'PaymentReview' : 'PendingPayment',
    total: 100,
    itemsCount: 1,
    createdAt,
    canCancel: true,
    canEdit: state !== 'locked',
    items: [
      {
        type: 'Bundle',
        bookId: null,
        bundleId: 1,
        title: messages.site.header.store,
        isbn: null,
        unitPrice: 100,
        discountPercent: 0,
        finalUnitPrice: 100,
        quantity: 1,
        lineTotal: 100,
        components: [
          { bookId: 1, title: messages.home.categories.heading, isbn: null, quantity: 1 },
        ],
      },
    ],
    address: {
      recipientName: messages.site.brand,
      phone: '01000000000',
      shippingZoneId: 1,
      governorateName: messages.site.brand,
      city: messages.site.brand,
      addressLine: messages.site.brand,
      landmark: null,
    },
    pricing: { subtotal: 100, couponCode: null, couponDiscount: 0, shippingFee: 0, total: 100 },
    paymentMethod: 'ManualTransfer',
    payments: [],
    shipment: null,
    customerNotes: null,
    cancelReason: null,
    expiresAt: '2026-01-16T10:00:00Z',
    timeline: [{ status: 'PendingPayment', at: createdAt }],
    rowVersion: 'AA==',
  };
  return (
    <main id="main-content">
      {state === 'detail' || state === 'locked' || state === 'zone-locked' ? (
        <OrderDetails id={id} fixture={order} />
      ) : (
        <OrdersList fixtures={list} />
      )}
    </main>
  );
}
