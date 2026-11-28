'use client';

import messages from '@/i18n/messages/ar.json';
import { RequirePermission } from '@/modules/admin-shell';
import { ADMIN_PERMISSIONS } from '@/shared/config/admin-permissions';
import { DataTable, FilterBar, TablePagination } from '@/shared/ui/admin/data-table';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

import { useAdminOrders } from '../hooks/use-admin-orders';
import { STATUS_KEY } from '../lib/orders-filters';
import styles from './admin-orders.module.css';
import { ORDER_COLUMNS, orderHref } from './orders-columns';
import { OrdersStatusTabs } from './orders-status-tabs';

const copy = messages.admin.orders;
const tableCopy = messages.admin.table;

function OrdersList() {
  const orders = useAdminOrders();
  const { data, error, isFiltered, isLoading, table } = orders;
  const rows = data?.items ?? [];
  // A 400 is the API refusing a filter: say so, and offer the way out. It is not a crash and not "no data".
  const isInvalidFilter = error?.kind === 'validation';
  const hasOtherError = error !== null && !isInvalidFilter;

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.subtitle}>{copy.subtitle}</p>
      </header>
      <OrdersStatusTabs active={table.state.values[STATUS_KEY]} />
      <div className={styles.panel}>
        <FilterBar
          filters={orders.barFilters}
          onChange={table.setFilters}
          values={table.state.values}
        />
        {orders.zonesFailed ? (
          <p className={styles.note} role="status">
            {copy.zonesError}
          </p>
        ) : null}
        {isInvalidFilter ? (
          <div className={styles.alertWrap}>
            <EmptyState
              action={
                <Button
                  onClick={() =>
                    table.setFilters({
                      from: null,
                      paymentMethod: null,
                      q: null,
                      status: null,
                      to: null,
                      zoneId: null,
                    })
                  }
                  variant="outline"
                >
                  {tableCopy.clearFilters}
                </Button>
              }
              description={copy.invalidFilterDescription}
              icon="x"
              title={copy.invalidFilterTitle}
              variant="error"
            />
          </div>
        ) : (
          <>
            <DataTable
              columns={ORDER_COLUMNS}
              getRowHref={orderHref}
              getRowKey={(order) => order.orderId}
              isError={hasOtherError}
              isFiltered={isFiltered}
              isLoading={isLoading}
              onRetry={orders.reload}
              rows={rows}
              skeletonRows={table.state.pageSize}
            />
            {data && rows.length > 0 ? (
              <TablePagination
                buildHref={table.buildHref}
                onPageSizeChange={table.setPageSize}
                pagination={{
                  hasNext: data.hasNextPage ?? false,
                  page: data.page,
                  pageSize: data.pageSize,
                  total: data.totalCount,
                }}
                rowsOnPage={rows.length}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

// /admin/orders. The list (and its requests) is created only after the permission check passes.
export function AdminOrdersPage() {
  return (
    <RequirePermission permission={ADMIN_PERMISSIONS.ordersView}>
      <OrdersList />
    </RequirePermission>
  );
}
