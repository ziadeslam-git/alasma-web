import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { buildOrder } from '@/test/fixtures/orders';

import { OrderStatusPanel } from './order-status-panel';

// The fixture order expires at 2026-01-17T10:00:00Z.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('OrderStatusPanel expiry note', () => {
  it('uses the future tense before expiresAt', () => {
    vi.setSystemTime(new Date('2026-01-10T10:00:00Z'));
    render(<OrderStatusPanel order={buildOrder()} />);

    expect(screen.getByText(/ينتهي موعد سداد الطلب/)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(messages.orders.expired.slice(0, 18)))).toBeNull();
  });

  it('says the payment period has ended once expiresAt has passed on an unpaid order', () => {
    vi.setSystemTime(new Date('2026-01-18T10:00:00Z'));
    render(<OrderStatusPanel order={buildOrder()} />);

    expect(screen.getByText(/انتهت مهلة سداد هذا الطلب/)).toBeInTheDocument();
    expect(screen.queryByText(/ينتهي موعد سداد الطلب/)).toBeNull();
  });
});
