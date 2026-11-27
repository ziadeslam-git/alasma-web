import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import openapi from '@/shared/lib/api/openapi.json';
import { axe } from '@/test/axe';

import { STATUS_TONES, type StatusType } from './status-map';
import { StatusPill } from './status-pill';

type Schemas = Record<string, { enum?: string[] }>;
const schemas = openapi.components.schemas as Schemas;

const ENTRIES = (Object.keys(STATUS_TONES) as StatusType[]).flatMap((type) =>
  Object.entries(STATUS_TONES[type]).map(([status, tone]) => ({ status, tone, type })),
);

describe('StatusPill', () => {
  it.each(ENTRIES)('$type / $status has a label and the $tone tone', ({ status, tone, type }) => {
    render(<StatusPill status={status} type={type} />);

    const label = (messages.admin.status as Record<string, Record<string, string>>)[type]?.[status];

    expect(label).toBeTruthy();
    expect(screen.getByText(label as string)).toHaveAttribute('data-tone', tone);
  });

  it('shows an unknown value as a neutral pill with the raw value', () => {
    render(<StatusPill status="FutureStatus" type="order" />);

    expect(screen.getByText('FutureStatus')).toHaveAttribute('data-tone', 'neutral');
  });

  it('does not crash on an empty value', () => {
    const { container } = render(<StatusPill status="" type="book" />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'neutral');
  });

  it('covers exactly the openapi enums (coupon: the real states, not the "All" filter value)', () => {
    const expected: Record<StatusType, string[]> = {
      alert: schemas.OrderAlertStatus?.enum ?? [],
      banner: schemas.BannerState?.enum ?? [],
      book: schemas.BookStatus?.enum ?? [],
      coupon: (schemas.CouponStatusFilter?.enum ?? []).filter((value) => value !== 'All'),
      order: schemas.OrderStatus?.enum ?? [],
      payment: schemas.PaymentStatus?.enum ?? [],
      request: schemas.PackageRequestStatus?.enum ?? [],
      review: schemas.ReviewStatus?.enum ?? [],
    };

    for (const type of Object.keys(expected) as StatusType[]) {
      expect(expected[type].length).toBeGreaterThan(0);
      expect(Object.keys(STATUS_TONES[type]).sort()).toEqual([...expected[type]].sort());
    }
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        {ENTRIES.map(({ status, type }) => (
          <StatusPill key={`${type}-${status}`} status={status} type={type} />
        ))}
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
