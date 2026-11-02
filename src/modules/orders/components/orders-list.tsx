'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { orderRoute, routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format';
import { EmptyState } from '@/shared/ui/empty-state';
import { Pagination } from '@/shared/ui/pagination';
import { Skeleton } from '@/shared/ui/skeleton';
import { listOrders, ORDER_STATUSES, type OrderList, type OrderStatus } from '../api/orders-api';
import styles from './orders.module.css';

export function OrdersList({
  page = 1,
  status,
  fixtures,
}: {
  page?: number;
  status?: OrderStatus;
  fixtures?: OrderList;
}) {
  const text = messages.orders;
  const [data, setData] = useState<OrderList | null>(fixtures ?? null);
  const [isLoading, setLoading] = useState(!fixtures);
  const [error, setError] = useState<ApiError | null>(null);
  useEffect(() => {
    if (fixtures) return;
    let isActive = true;
    void listOrders(page, status)
      .then((result) => {
        if (isActive) setData(result);
      })
      .catch((cause: unknown) => {
        if (isActive)
          setError(cause instanceof ApiError ? cause : new ApiError({ kind: 'unknown' }));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [fixtures, page, status]);
  const href = (nextStatus?: OrderStatus, nextPage = 1) => {
    const query = new URLSearchParams();
    if (nextStatus) query.set('status', nextStatus);
    if (nextPage > 1) query.set('page', String(nextPage));
    return `${routes.accountOrders}${query.size ? `?${query.toString()}` : ''}`;
  };
  const totalPages = data
    ? (data.totalPages ?? (data.pageSize > 0 ? Math.ceil(data.totalCount / data.pageSize) : 0))
    : 0;
  return (
    <section className={styles.section}>
      <h1>{text.title}</h1>
      {error?.code === 'email_not_confirmed' ? (
        <UnconfirmedEmailBanner />
      ) : error ? (
        <p role="alert">{getApiErrorMessage(error)}</p>
      ) : null}
      <nav aria-label={text.statusLabel} className={styles.filters}>
        <Link aria-current={!status ? 'page' : undefined} href={href()}>
          {text.all}
        </Link>
        {ORDER_STATUSES.map((item) => (
          <Link aria-current={status === item ? 'page' : undefined} href={href(item)} key={item}>
            {text.status[item]}
          </Link>
        ))}
      </nav>
      {isLoading ? (
        <Skeleton shape="card" />
      ) : data?.items.length ? (
        <>
          {data.items.map((item) => (
            <article key={item.id} className={styles.card}>
              <h2>
                <Link href={orderRoute(item.id)}>{item.orderNumber}</Link>
              </h2>
              <span>{text.status[item.status]}</span>
              <span>{formatMoney(item.total)}</span>
              <span>{formatNumber(item.itemsCount)}</span>
              <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
              {item.canCancel ? <span>{text.canCancel}</span> : null}
            </article>
          ))}
          {totalPages > 1 ? (
            <Pagination
              page={data.page}
              totalPages={totalPages}
              buildHref={(nextPage) => href(status, nextPage)}
              label={messages.catalog.page.pagination.label}
              nextLabel={messages.catalog.page.pagination.next}
              previousLabel={messages.catalog.page.pagination.previous}
            />
          ) : null}
        </>
      ) : !error ? (
        <EmptyState icon="book" title={text.empty} description={text.emptyDescription} />
      ) : null}
    </section>
  );
}
