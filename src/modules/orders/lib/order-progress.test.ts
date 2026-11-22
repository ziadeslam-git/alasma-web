import { describe, expect, it } from 'vitest';

import { ORDER_STATUSES } from '../api/orders-api';
import { orderTone, reachedSteps, TRACKER_STEPS } from './order-progress';

describe('order progress', () => {
  it('has the four steps of the design', () => {
    expect(TRACKER_STEPS).toHaveLength(4);
  });

  it.each([
    ['PendingPayment', 1, 'wait'],
    ['PaymentReview', 1, 'wait'],
    ['Confirmed', 2, 'ship'],
    ['Preparing', 2, 'ship'],
    ['Shipped', 3, 'ship'],
    ['Delivered', 4, 'done'],
    ['Cancelled', 0, 'cancelled'],
  ] as const)('maps %s to %i reached steps and the %s tone', (status, steps, tone) => {
    expect(reachedSteps(status)).toBe(steps);
    expect(orderTone(status)).toBe(tone);
  });

  it('covers every status the API can send', () => {
    for (const status of ORDER_STATUSES) {
      expect(reachedSteps(status)).toBeGreaterThanOrEqual(0);
      expect(orderTone(status)).toBeTruthy();
    }
  });
});
