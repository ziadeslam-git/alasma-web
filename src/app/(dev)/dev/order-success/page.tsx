import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import messages from '@/i18n/messages/ar.json';
import { OrderSuccess } from '@/modules/checkout';
import type { Order } from '@/modules/orders';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DevOrderSuccessPage({
  searchParams,
}: { searchParams?: Promise<{ state?: string }> } = {}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const state = (await searchParams)?.state;
  const id = '12345678-1234-1234-1234-123456789abc';
  const order: Order = {
    id,
    orderNumber: 'ORD-1',
    status: 'PendingPayment',
    total: 100,
    itemsCount: 1,
    createdAt: '2026-01-15T10:00:00Z',
    canCancel: true,
    canEdit: true,
    items: [
      {
        type: state === 'bundle' ? 'Bundle' : 'Book',
        bookId: state === 'bundle' ? null : 1,
        bundleId: state === 'bundle' ? 1 : null,
        title: messages.site.header.store,
        isbn: null,
        unitPrice: 100,
        discountPercent: 0,
        finalUnitPrice: 100,
        quantity: 1,
        lineTotal: 100,
        components:
          state === 'bundle'
            ? [{ bookId: 1, title: messages.home.categories.heading, isbn: null, quantity: 1 }]
            : [],
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
    paymentMethod: state === 'cash' ? 'CashOnDelivery' : 'ManualTransfer',
    payments: [],
    shipment: null,
    customerNotes: null,
    cancelReason: null,
    expiresAt: '2026-01-16T10:00:00Z',
    timeline: [],
    rowVersion: 'AA==',
  };
  const methods = [
    {
      method: 'ManualTransfer' as const,
      details: {
        transferNumbers: [
          { channel: 'VodafoneCash' as const, number: '01000000000' },
          { channel: 'InstaPay' as const, number: '01200000000' },
        ],
        instructions: null,
        expiresInHours: 24,
      },
    },
  ];
  const fixtureState = state === 'loading' || state === 'not-found' ? state : undefined;
  return (
    <main id="main-content">
      <OrderSuccess id={id} fixture={order} fixtureMethods={methods} fixtureState={fixtureState} />
    </main>
  );
}
