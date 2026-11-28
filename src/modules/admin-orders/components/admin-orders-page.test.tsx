import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { SEARCH_DEBOUNCE_MS } from '@/shared/ui/admin/data-table';
import { axe } from '@/test/axe';

import type { AdminOrderListItem } from '../api/admin-orders-api';
import { AdminOrdersPage } from './admin-orders-page';

const mocks = vi.hoisted(() => ({
  auth: { status: 'authenticated', user: { permissions: ['Orders.View'] } } as {
    status: string;
    user: { permissions: string[] } | null;
  },
  replace: vi.fn(),
  search: '',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/orders',
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock('@/modules/auth', async () => {
  const { createBrowserClient } = await import('@/shared/lib/api');

  return {
    getAdminApiClient: () =>
      createBrowserClient({ getAccessToken: () => 'token' }, { baseUrl: 'http://localhost' }),
    useAuth: () => mocks.auth,
  };
});

const copy = messages.admin.orders;
const tableCopy = messages.admin.table;
const base = 'http://localhost/api/v1';

const ORDER: AdminOrderListItem = {
  createdAt: '2026-10-12T10:00:00Z',
  expiresAt: null,
  governorate: 'القاهرة',
  itemsCount: 3,
  orderId: '11111111-1111-1111-1111-111111111111',
  orderNumber: 'AS-20418',
  paymentMethod: 'CashOnDelivery',
  phone: '01000000000',
  recipientName: 'أحمد محمد',
  status: 'PaymentReview',
  total: 412,
};

const ZONES = [
  {
    estimatedDays: 2,
    freeShippingThreshold: null,
    id: 1,
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    shippingPrice: 40,
  },
  {
    estimatedDays: 3,
    freeShippingThreshold: null,
    id: 2,
    nameAr: 'الإسكندرية',
    nameEn: 'Alex',
    shippingPrice: 50,
  },
];

// What the four summary cards count, written here by hand (never read from the code under test).
const KPI_TOTALS: Record<string, number> = {
  '': 23,
  Preparing: 12,
  PaymentReview: 7,
  Shipped: 18,
};

function page(items: AdminOrderListItem[], extra: Record<string, unknown> = {}) {
  return {
    hasNextPage: false,
    hasPreviousPage: false,
    items,
    page: 1,
    pageSize: 25,
    totalCount: items.length,
    totalPages: 1,
    ...extra,
  };
}

let kpiSeen: URL[] = [];
let kpiFailure: string | null = null;

const isKpiRequest = (url: URL) => url.searchParams.get('pageSize') === '1';

// The list requests go to `handler`; the one-row count requests of the summary cards are answered here.
function serve(handler: (url: URL) => Response | Promise<Response>) {
  const seen: URL[] = [];

  server.use(
    http.get(`${base}/shipping/zones`, () => HttpResponse.json(ZONES)),
    http.get(`${base}/admin/orders`, ({ request }) => {
      const url = new URL(request.url);

      if (isKpiRequest(url)) {
        const status = url.searchParams.get('status') ?? '';

        kpiSeen.push(url);

        if (kpiFailure === status) return HttpResponse.json({ status: 500 }, { status: 500 });

        return HttpResponse.json(page([], { pageSize: 1, totalCount: KPI_TOTALS[status] ?? 0 }));
      }

      seen.push(url);

      return handler(url);
    }),
  );

  return seen;
}

beforeEach(() => {
  mocks.auth = { status: 'authenticated', user: { permissions: ['Orders.View'] } };
  mocks.replace.mockReset();
  mocks.search = '';
  kpiSeen = [];
  kpiFailure = null;
});

describe('AdminOrdersPage', () => {
  it('shows the rows with the backend values and links the row to its details', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    const { container } = render(<AdminOrdersPage />);

    expect(await screen.findByRole('link', { name: '#AS-20418' })).toHaveAttribute(
      'href',
      `/admin/orders/${ORDER.orderId}`,
    );
    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
    const row = screen.getByRole('link', { name: '#AS-20418' }).closest('tr') as HTMLElement;

    expect(within(row).getByText(copy.paymentMethods.CashOnDelivery)).toBeInTheDocument();
    expect(within(row).getByText(messages.admin.status.order.PaymentReview)).toBeInTheDocument();
    expect(container.textContent).not.toContain('@');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('draws the frame columns: selection, payment status, and view / edit / delete in the row', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);

    expect(headers).toEqual([
      '',
      copy.columns.order,
      copy.columns.customer,
      copy.columns.books,
      copy.columns.total,
      copy.columns.payment,
      copy.columns.paymentStatus,
      copy.columns.status,
      copy.columns.date,
      copy.columns.actions,
    ]);
    expect(screen.getByRole('checkbox', { name: copy.selectAll })).toBeDisabled();

    const row = screen.getByRole('link', { name: '#AS-20418' }).closest('tr') as HTMLElement;

    expect(within(row).getByRole('checkbox', { name: copy.selectRow })).toBeDisabled();
    // The list endpoint has no payment status: the cell is a dash, never an invented value.
    expect(within(row).getByText('—')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: copy.viewOrder })).toHaveAttribute(
      'href',
      `/admin/orders/${ORDER.orderId}`,
    );
    expect(within(row).getByRole('button', { name: copy.editOrder })).toBeDisabled();
    expect(within(row).getByRole('button', { name: copy.deleteOrder })).toBeDisabled();
  });

  it('draws the sub-navigation of the frame: the list is current, the screens not built are inert', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    const nav = screen.getByRole('navigation', { name: copy.subNavLabel });

    expect(within(nav).getByRole('link', { name: copy.subNav.all })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getAllByRole('link')).toHaveLength(1);

    for (const key of [
      'details',
      'adminView',
      'payments',
      'shipping',
      'carts',
      'reservations',
      'prints',
    ] as const) {
      expect(within(nav).getByText(copy.subNav[key])).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('draws the export action inert, since there is no export endpoint', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    expect(screen.getByRole('button', { name: copy.export })).toBeDisabled();
  });

  it('fills the four summary cards from the API totals, one row per request', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);

    const cards = screen.getByRole('region', { name: copy.kpiLabel });

    await waitFor(() => expect(within(cards).getByText('23')).toBeInTheDocument());
    expect(within(cards).getByText('7')).toBeInTheDocument();
    expect(within(cards).getByText('12')).toBeInTheDocument();
    expect(within(cards).getByText('18')).toBeInTheDocument();
    expect(within(cards).getByText(copy.kpis.today)).toBeInTheDocument();
    expect(within(cards).getByText(copy.kpis.review)).toBeInTheDocument();
    expect(within(cards).getByText(copy.kpis.preparing)).toBeInTheDocument();
    expect(within(cards).getByText(copy.kpis.shipped)).toBeInTheDocument();

    expect(kpiSeen).toHaveLength(4);
    expect(kpiSeen.every((url) => url.searchParams.get('page') === '1')).toBe(true);
    expect(kpiSeen.map((url) => url.searchParams.get('status')).sort()).toEqual([
      'PaymentReview',
      'Preparing',
      'Shipped',
      null,
    ]);

    const today = kpiSeen.find((url) => !url.searchParams.has('status'));
    const from = new Date(today?.searchParams.get('from') ?? '');
    const to = new Date(today?.searchParams.get('to') ?? '');

    // Today is one calendar day of the browser: from its start to the start of the next day.
    expect(from.getTime()).toBeLessThanOrEqual(Date.now());
    expect(to.getTime()).toBeGreaterThan(Date.now());
    expect(to.getTime() - from.getTime()).toBeGreaterThanOrEqual(23 * 3_600_000);
    expect(to.getTime() - from.getTime()).toBeLessThanOrEqual(25 * 3_600_000);
  });

  it('shows a dash on the card whose request failed and keeps the others and the list', async () => {
    kpiFailure = 'Shipped';
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);

    const cards = screen.getByRole('region', { name: copy.kpiLabel });

    expect(await within(cards).findByText(copy.kpiUnavailable)).toBeInTheDocument();
    expect(within(cards).getByText('7')).toBeInTheDocument();
    expect(within(cards).queryByText('18')).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '#AS-20418' })).toBeInTheDocument();
  });

  it('does not filter the cards by the list filters', async () => {
    mocks.search = 'status=Shipped&q=ali';
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });
    await waitFor(() => expect(kpiSeen).toHaveLength(4));

    expect(kpiSeen.some((url) => url.searchParams.has('q'))).toBe(false);
  });

  it('sends every filter from the URL to the API in its own shape', async () => {
    mocks.search =
      'status=Shipped&paymentMethod=CashOnDelivery&zoneId=2&q=ali&from=2026-01-01&to=2026-01-31&page=2';
    const seen = serve(() => HttpResponse.json(page([ORDER], { page: 2, totalCount: 40 })));

    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    expect(seen).toHaveLength(1);
    const params = seen[0]?.searchParams;

    expect(params?.get('status')).toBe('Shipped');
    expect(params?.get('paymentMethod')).toBe('CashOnDelivery');
    expect(params?.get('zoneId')).toBe('2');
    expect(params?.get('q')).toBe('ali');
    expect(params?.get('from')).toBe('2026-01-01T00:00:00Z');
    expect(params?.get('to')).toBe('2026-01-31T00:00:00Z');
    expect(params?.get('page')).toBe('2');
  });

  it('ignores an unknown or numeric status and still renders the list', async () => {
    mocks.search = 'status=Bogus&paymentMethod=Nope&zoneId=999';
    const seen = serve(() => HttpResponse.json(page([ORDER])));

    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    expect(seen[0]?.searchParams.has('status')).toBe(false);
    expect(seen[0]?.searchParams.has('paymentMethod')).toBe(false);
    expect(seen[0]?.searchParams.has('zoneId')).toBe(false);
    expect(screen.getByRole('combobox', { name: copy.statusFilter })).toHaveValue('');
  });

  it('puts search, status, payment and zone in one filter row, and writes a choice to the URL', async () => {
    mocks.search = 'status=Shipped&page=3';
    serve(() => HttpResponse.json(page([ORDER])));

    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    const bar = screen.getByRole('search');

    expect(within(bar).getByRole('searchbox', { name: copy.searchLabel })).toBeInTheDocument();
    expect(within(bar).getByRole('combobox', { name: copy.statusFilter })).toHaveValue('Shipped');
    expect(within(bar).getByRole('combobox', { name: copy.paymentFilter })).toBeInTheDocument();
    expect(within(bar).getByRole('combobox', { name: copy.zoneFilter })).toBeInTheDocument();
    expect(within(bar).getByLabelText(tableCopy.dateFrom)).toBeInTheDocument();

    fireEvent.change(within(bar).getByRole('combobox', { name: copy.statusFilter }), {
      target: { value: 'Delivered' },
    });
    expect(mocks.replace).toHaveBeenCalledWith('/admin/orders?status=Delivered', {
      scroll: false,
    });
  });

  it('writes the search to the URL once, after the debounce', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    const input = screen.getByRole('searchbox', { name: copy.searchLabel });

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ali' } });
    expect(mocks.replace).not.toHaveBeenCalled();

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(1), {
      timeout: SEARCH_DEBOUNCE_MS * 3,
    });
    expect(mocks.replace).toHaveBeenCalledWith('/admin/orders?q=ali', { scroll: false });
  });

  it('blocks a range longer than 366 days: the URL is not changed and the picker says why', async () => {
    serve(() => HttpResponse.json(page([ORDER])));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    fireEvent.change(screen.getByLabelText(tableCopy.dateFrom), {
      target: { value: '2025-01-01' },
    });
    mocks.replace.mockClear();
    fireEvent.change(screen.getByLabelText(tableCopy.dateTo), { target: { value: '2026-06-01' } });

    expect(screen.getByRole('alert')).toHaveTextContent('366');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('shows the empty state, with different words when a filter is active', async () => {
    serve(() => HttpResponse.json(page([])));
    const { unmount } = render(<AdminOrdersPage />);

    expect(await screen.findByText(tableCopy.emptyTitle)).toBeInTheDocument();
    unmount();

    mocks.search = 'paymentMethod=ManualTransfer';
    render(<AdminOrdersPage />);
    expect(await screen.findByText(tableCopy.emptyFilteredTitle)).toBeInTheDocument();
  });

  it('shows an error with a retry that asks again', async () => {
    let calls = 0;

    serve(() => {
      calls += 1;

      return calls === 1
        ? HttpResponse.json({ status: 500 }, { status: 500 })
        : HttpResponse.json(page([ORDER]));
    });
    render(<AdminOrdersPage />);

    fireEvent.click(await screen.findByRole('button', { name: tableCopy.retry }));

    expect(await screen.findByRole('link', { name: '#AS-20418' })).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('turns a 400 into a message and a way out, not a crash', async () => {
    mocks.search = 'q=x';
    serve(() =>
      HttpResponse.json(
        { errors: { Q: ['bad'] }, status: 400 },
        { headers: { 'content-type': 'application/problem+json' }, status: 400 },
      ),
    );
    render(<AdminOrdersPage />);

    expect(await screen.findByText(copy.invalidFilterTitle)).toBeInTheDocument();
    // The filter bar offers the same button; the one in the message is the last on the page.
    fireEvent.click(screen.getAllByRole('button', { name: tableCopy.clearFilters }).at(-1)!);
    expect(mocks.replace).toHaveBeenCalled();
  });

  it('keeps the list when the zone list fails', async () => {
    server.use(
      http.get(`${base}/shipping/zones`, () => HttpResponse.json({ status: 500 }, { status: 500 })),
      http.get(`${base}/admin/orders`, ({ request }) =>
        HttpResponse.json(
          isKpiRequest(new URL(request.url))
            ? page([], { pageSize: 1, totalCount: 1 })
            : page([ORDER]),
        ),
      ),
    );
    render(<AdminOrdersPage />);

    expect(await screen.findByRole('link', { name: '#AS-20418' })).toBeInTheDocument();
    expect(screen.getByText(copy.zonesError)).toBeInTheDocument();
  });

  it('links the pages and never asks the API without the permission', async () => {
    mocks.auth = { status: 'authenticated', user: { permissions: [] } };
    // No handler is registered: a request would fail the test (onUnhandledFrame: error).
    render(<AdminOrdersPage />);

    expect(screen.queryByRole('link', { name: '#AS-20418' })).not.toBeInTheDocument();
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: copy.kpiLabel })).not.toBeInTheDocument();
  });

  it('links the next page from the pagination, without a page-size select (the frame has none)', async () => {
    serve(() => HttpResponse.json(page([ORDER], { hasNextPage: true, totalCount: 60 })));
    render(<AdminOrdersPage />);
    await screen.findByRole('link', { name: '#AS-20418' });

    expect(screen.getByRole('link', { name: tableCopy.next })).toHaveAttribute(
      'href',
      '/admin/orders?page=2',
    );
    expect(screen.queryByRole('combobox', { name: tableCopy.pageSize })).not.toBeInTheDocument();
  });
});
