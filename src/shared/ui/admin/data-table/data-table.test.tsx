import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { DataTable } from './data-table';
import { FilterBar, SEARCH_DEBOUNCE_MS } from './filter-bar';
import { TablePagination } from './table-pagination';
import type { DataTableColumn, FilterDef } from './types';
import { validateDateRange } from './date-range-picker';

const copy = messages.admin.table;

type Row = { id: string; name: string; note: string };

const ROWS: Row[] = [
  { id: '1', name: 'One', note: 'a' },
  { id: '2', name: 'Two', note: 'b' },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { cell: (row) => row.name, header: 'Name', id: 'name', isPrimary: true },
  { cell: (row) => row.note, header: 'Note', id: 'note', priority: 'low' },
  { cell: () => <button type="button">Go</button>, header: '', id: 'actions', isActions: true },
];

const FILTERS: FilterDef[] = [
  { key: 'q', label: 'Search', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Pending', value: 'PendingPayment' },
      { label: 'Shipped', value: 'Shipped' },
    ],
    type: 'status',
  },
  { fromKey: 'from', label: 'Period', maxDays: 92, toKey: 'to', type: 'dateRange' },
];

function table(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return (
    <DataTable
      columns={COLUMNS}
      getRowHref={(row) => `/r/${row.id}`}
      getRowKey={(row) => row.id}
      rows={ROWS}
      {...props}
    />
  );
}

describe('DataTable states', () => {
  it('ready: real links in the primary cell, labels for the card layout, low priority marked', async () => {
    const { container } = render(table());

    expect(screen.getByRole('link', { name: 'One' })).toHaveAttribute('href', '/r/1');
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(container.querySelector('td[data-label="Note"]')).toBeInTheDocument();
    expect(container.querySelector('td[data-label=""]')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading: skeleton with the requested number of rows, no data rows', async () => {
    const { container } = render(table({ isLoading: true, skeletonRows: 4 }));

    expect(container.querySelectorAll('[data-skeleton-row]')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: 'One' })).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('empty: plain message, and the filtered variant when filters are active', async () => {
    const { container, rerender } = render(table({ rows: [] }));

    expect(screen.getByText(copy.emptyTitle)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    rerender(table({ isFiltered: true, rows: [] }));

    expect(screen.getByText(copy.emptyFilteredTitle)).toBeInTheDocument();
  });

  it('error: message with a retry button that calls onRetry', async () => {
    const onRetry = vi.fn();
    const { container } = render(table({ isError: true, onRetry }));

    fireEvent.click(screen.getByRole('button', { name: copy.retry }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('FilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces the search by 300ms and writes one q for the last text', () => {
    const onChange = vi.fn();

    render(<FilterBar filters={FILTERS} onChange={onChange} values={{}} />);

    const input = screen.getByRole('searchbox', { name: 'Search' });

    fireEvent.change(input, { target: { value: 'no' } });
    act(() => void vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    fireEvent.change(input, { target: { value: 'novel' } });
    act(() => void vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));

    expect(onChange).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ q: 'novel' });
  });

  it('a select change is immediate and only offers enum names', () => {
    const onChange = vi.fn();

    render(<FilterBar filters={FILTERS} onChange={onChange} values={{}} />);

    const select = screen.getByRole('combobox', { name: 'Status' });
    const values = within(select)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value);

    expect(values).toEqual(['', 'PendingPayment', 'Shipped']);

    fireEvent.change(select, { target: { value: 'Shipped' } });

    expect(onChange).toHaveBeenCalledWith({ status: 'Shipped' });
  });

  it('blocks a range longer than maxDays with a message and does not write it', () => {
    const onChange = vi.fn();

    render(<FilterBar filters={FILTERS} onChange={onChange} values={{}} />);

    fireEvent.change(screen.getByLabelText(copy.dateFrom), { target: { value: '2026-01-01' } });

    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-01-01', to: null });

    fireEvent.change(screen.getByLabelText(copy.dateTo), { target: { value: '2026-06-01' } });

    expect(screen.getByRole('alert')).toHaveTextContent('92');
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(copy.dateTo), { target: { value: '2026-03-01' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-01-01', to: '2026-03-01' });
  });

  it('the URL echo of a valid from does not wipe a blocked to', () => {
    const onChange = vi.fn();
    const { rerender } = render(<FilterBar filters={FILTERS} onChange={onChange} values={{}} />);

    fireEvent.change(screen.getByLabelText(copy.dateFrom), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText(copy.dateTo), { target: { value: '2028-01-01' } });
    rerender(<FilterBar filters={FILTERS} onChange={onChange} values={{ from: '2026-01-01' }} />);

    expect(screen.getByLabelText(copy.dateTo)).toHaveValue('2028-01-01');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows clear only when something is active and clears every key', () => {
    const onChange = vi.fn();
    const { rerender } = render(<FilterBar filters={FILTERS} onChange={onChange} values={{}} />);

    expect(screen.queryByRole('button', { name: copy.clearFilters })).not.toBeInTheDocument();

    rerender(<FilterBar filters={FILTERS} onChange={onChange} values={{ status: 'Shipped' }} />);
    fireEvent.click(screen.getByRole('button', { name: copy.clearFilters }));

    expect(onChange).toHaveBeenCalledWith({ from: null, q: null, status: null, to: null });
  });

  it('has no axe violations', async () => {
    vi.useRealTimers();

    const { container } = render(
      <FilterBar filters={FILTERS} onChange={vi.fn()} values={{ q: 'a' }} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('validateDateRange', () => {
  it('counts both ends: 366 days is allowed, 367 is not', () => {
    expect(validateDateRange('2026-01-01', '2026-12-31', 366)).toBeNull();
    expect(validateDateRange('2026-01-01', '2027-01-02', 366)).toBe('tooLong');
  });

  it('flags an end before the start and allows an open end', () => {
    expect(validateDateRange('2026-02-01', '2026-01-01', 92)).toBe('order');
    expect(validateDateRange('2026-02-01', '', 92)).toBeNull();
  });
});

describe('TablePagination', () => {
  const buildHref = (page: number) => `/x?page=${page}`;

  it('renders the range, page links and calls onPageSizeChange', async () => {
    const onPageSizeChange = vi.fn();
    const { container } = render(
      <TablePagination
        buildHref={buildHref}
        onPageSizeChange={onPageSizeChange}
        pagination={{ hasNext: true, page: 2, pageSize: 25, total: 312 }}
        rowsOnPage={25}
      />,
    );

    expect(screen.getByRole('link', { name: copy.next })).toHaveAttribute('href', '/x?page=3');
    expect(screen.getByRole('link', { name: copy.previous })).toHaveAttribute('href', '/x?page=1');
    expect(screen.getByText(/من/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: copy.pageSize }), {
      target: { value: '50' },
    });

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('disables previous on page 1 and next on the last page', () => {
    render(
      <TablePagination
        buildHref={buildHref}
        onPageSizeChange={vi.fn()}
        pagination={{ hasNext: false, page: 1, pageSize: 25, total: 10 }}
        rowsOnPage={10}
      />,
    );

    expect(screen.getByLabelText(copy.previous)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText(copy.next)).toHaveAttribute('aria-disabled', 'true');
  });
});
