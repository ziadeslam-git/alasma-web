import messages from '@/i18n/messages/ar.json';
import type { FilterDef, SelectOption, TableState } from '@/shared/ui/admin/data-table';

import type {
  AdminOrdersQuery,
  AdminOrderStatus,
  AdminPaymentMethod,
} from '../api/admin-orders-api';

export const MAX_RANGE_DAYS = 366;

export const STATUS_KEY = 'status';
export const PAYMENT_KEY = 'paymentMethod';
export const ZONE_KEY = 'zoneId';
export const SEARCH_KEY = 'q';
export const FROM_KEY = 'from';
export const TO_KEY = 'to';

const copy = messages.admin.orders;
const statusLabels = messages.admin.status.order;

// The quick tabs, in the order of the screen. The values are the API's enum names.
export const STATUS_TABS: readonly AdminOrderStatus[] = [
  'PendingPayment',
  'PaymentReview',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const PAYMENT_METHODS: readonly AdminPaymentMethod[] = ['ManualTransfer', 'CashOnDelivery'];

const statusOptions: SelectOption[] = STATUS_TABS.map((value) => ({
  label: statusLabels[value],
  value,
}));

const paymentOptions: SelectOption[] = PAYMENT_METHODS.map((value) => ({
  label: copy.paymentMethods[value],
  value,
}));

// What the URL may hold. The status is read here (so ?status=Bogus is dropped) but drawn by the tabs, not the bar.
export function buildUrlFilters(zoneOptions: readonly SelectOption[]): FilterDef[] {
  return [
    { key: SEARCH_KEY, label: copy.searchLabel, placeholder: copy.searchPlaceholder, type: 'text' },
    { key: STATUS_KEY, label: copy.columns.status, options: statusOptions, type: 'status' },
    { key: PAYMENT_KEY, label: copy.paymentFilter, options: paymentOptions, type: 'select' },
    { key: ZONE_KEY, label: copy.zoneFilter, options: zoneOptions, type: 'select' },
    {
      fromKey: FROM_KEY,
      label: copy.dateFilter,
      maxDays: MAX_RANGE_DAYS,
      toKey: TO_KEY,
      type: 'dateRange',
    },
  ];
}

export function barFilters(filters: readonly FilterDef[]): FilterDef[] {
  return filters.filter((filter) => !('key' in filter) || filter.key !== STATUS_KEY);
}

// A day typed in the picker (2026-01-31) -> the UTC instant the API expects.
function startOfUtcDay(day: string): string {
  return `${day}T00:00:00Z`;
}

// TableState -> the API query. Only values that survived readTableState are here, so an unknown status or a
// hand-typed zone never reaches the server from the URL.
export function toAdminOrdersQuery(state: TableState): AdminOrdersQuery {
  const { values } = state;
  const query: AdminOrdersQuery = { page: state.page, pageSize: state.pageSize };

  if (values[STATUS_KEY]) query.status = values[STATUS_KEY] as AdminOrderStatus;
  if (values[PAYMENT_KEY]) query.paymentMethod = values[PAYMENT_KEY] as AdminPaymentMethod;
  if (values[ZONE_KEY]) query.zoneId = Number(values[ZONE_KEY]);
  if (values[SEARCH_KEY]) query.q = values[SEARCH_KEY].slice(0, 100);
  if (values[FROM_KEY]) query.from = startOfUtcDay(values[FROM_KEY]);
  if (values[TO_KEY]) query.to = startOfUtcDay(values[TO_KEY]);

  return query;
}
