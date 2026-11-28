import type { ReactNode } from 'react';

// 'low' columns are hidden on phones (the card keeps the high ones and the actions); the actions column always stays.
export type ColumnPriority = 'high' | 'low';

export type DataTableColumn<Row> = {
  cell: (row: Row) => ReactNode;
  header: string;
  // Drawn in the header cell instead of the text (the select-all box); `header` stays its accessible name.
  headerContent?: ReactNode;
  id: string;
  isActions?: boolean;
  // A narrow checkbox column: 44px on a desktop, not drawn in the phone card (the frame hides it there).
  isSelection?: boolean;
  // The cell that carries the row link (one per table).
  isPrimary?: boolean;
  priority?: ColumnPriority;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type TextFilterDef = {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text';
};

// 'status' is a select whose values are the API's string enum names (PendingPayment ...), never numbers.
export type SelectFilterDef = {
  key: string;
  label: string;
  options: readonly SelectOption[];
  type: 'select' | 'status';
};

export type DateRangeFilterDef = {
  fromKey: string;
  label: string;
  maxDays: number;
  toKey: string;
  type: 'dateRange';
};

export type FilterDef = DateRangeFilterDef | SelectFilterDef | TextFilterDef;

export type PaginationState = {
  hasNext: boolean;
  page: number;
  pageSize: number;
  total: number | null;
};

export type TableState = {
  page: number;
  pageSize: number;
  values: Record<string, string>;
};
