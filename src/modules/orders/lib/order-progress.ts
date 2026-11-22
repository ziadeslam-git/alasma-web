import type { OrderStatus } from '../api/orders-api';

// The four steps of the design's tracker (design/OrderDetail.dc.html .trk): ordered, payment confirmed, out for
// delivery, delivered. The step comes from the order status the API sends; no date or price is computed here.
export const TRACKER_STEPS = ['stepOrdered', 'stepPaid', 'stepShipping', 'stepDelivered'] as const;
export type TrackerStep = (typeof TRACKER_STEPS)[number];

export type OrderTone = 'wait' | 'ship' | 'done' | 'cancelled';

const REACHED_STEPS: Record<OrderStatus, number> = {
  PendingPayment: 1,
  PaymentReview: 1,
  Confirmed: 2,
  Preparing: 2,
  Shipped: 3,
  Delivered: 4,
  Cancelled: 0,
};

const TONES: Record<OrderStatus, OrderTone> = {
  PendingPayment: 'wait',
  PaymentReview: 'wait',
  Confirmed: 'ship',
  Preparing: 'ship',
  Shipped: 'ship',
  Delivered: 'done',
  Cancelled: 'cancelled',
};

/** How many of the four steps are reached (0 for a cancelled order, which the tracker draws all red). */
export const reachedSteps = (status: OrderStatus): number => REACHED_STEPS[status];

export const orderTone = (status: OrderStatus): OrderTone => TONES[status];
