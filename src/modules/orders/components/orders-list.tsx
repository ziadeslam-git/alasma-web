'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button, ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Pagination } from '@/shared/ui/pagination';
import { Skeleton } from '@/shared/ui/skeleton';
import { listOrders, ORDER_STATUSES, type OrderList, type OrderStatus } from '../api/orders-api';
import { OrderListCard } from './order-list-card';
import { OrdersStats } from './orders-stats';
import styles from './orders-list.module.css';

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
  const [reloadKey, setReloadKey] = useState(0);
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
  }, [fixtures, page, status, reloadKey]);
  const href = (nextStatus?: OrderStatus, nextPage = 1) => {
    const query = new URLSearchParams();
    if (nextStatus) query.set('status', nextStatus);
    if (nextPage > 1) query.set('page', String(nextPage));
    return `${routes.accountOrders}${query.size ? `?${query.toString()}` : ''}`;
  };
  const retry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };
  const totalPages = data
    ? (data.totalPages ?? (data.pageSize > 0 ? Math.ceil(data.totalCount / data.pageSize) : 0))
    : 0;
  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>{text.title}</h1>
          <p className={styles.subtitle}>{text.subtitle}</p>
        </div>
        <ButtonLink href={routes.books} leadingIcon="plus">
          {text.newOrder}
        </ButtonLink>
      </header>
      {/* the total is only the total of the unfiltered list */}
      <OrdersStats total={data && !status ? data.totalCount : null} />
      {error?.code === 'email_not_confirmed' ? (
        <UnconfirmedEmailBanner />
      ) : error ? (
        <div className={styles.alert} role="alert">
          <p>{getApiErrorMessage(error)}</p>
          <Button onClick={retry} size="sm" variant="outline">
            {text.retry}
          </Button>
        </div>
      ) : null}
      <nav aria-label={text.statusLabel} className={styles.tabs}>
        <Link aria-current={!status ? 'page' : undefined} href={href()}>
          {text.tabAll}
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
          <div className={styles.cards}>
            {data.items.map((item) => (
              <OrderListCard item={item} key={item.id} />
            ))}
          </div>
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
