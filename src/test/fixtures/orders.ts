import type { Order } from '@/modules/orders';

export const orderFixtureId = '12345678-1234-1234-1234-123456789abc';
export const paymentFixtureId = '87654321-4321-4321-4321-cba987654321';

type FixturePayment = Order['payments'][number];

export function buildPayment(overrides: Partial<FixturePayment> = {}): FixturePayment {
  return {
    id: paymentFixtureId,
    method: 'ManualTransfer',
    status: 'Pending',
    amount: 250,
    submittedAt: null,
    rejectionReason: null,
    ...overrides,
  };
}

// A ManualTransfer order that waits for its receipt; override what a test needs.
export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: orderFixtureId,
    orderNumber: 'ORD-1',
    status: 'PendingPayment',
    total: 250,
    itemsCount: 0,
    createdAt: '2026-01-15T10:00:00Z',
    canCancel: true,
    canEdit: true,
    items: [],
    address: {
      recipientName: 'Name',
      phone: '01000000000',
      shippingZoneId: 1,
      governorateName: 'Zone',
      city: 'City',
      addressLine: 'Street',
      landmark: null,
    },
    pricing: { subtotal: 250, couponCode: null, couponDiscount: 0, shippingFee: 0, total: 250 },
    paymentMethod: 'ManualTransfer',
    payments: [buildPayment()],
    shipment: null,
    customerNotes: null,
    cancelReason: null,
    expiresAt: '2026-01-17T10:00:00Z',
    timeline: [],
    rowVersion: 'AA==',
    ...overrides,
  };
}
