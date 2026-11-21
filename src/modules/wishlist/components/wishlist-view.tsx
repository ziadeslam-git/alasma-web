'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { BookCard } from '@/modules/catalog';
import { routes } from '@/shared/config/routes';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatNumber } from '@/shared/lib/format';
import { Button, ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Pagination } from '@/shared/ui/pagination';
import { Skeleton } from '@/shared/ui/skeleton';
import { FeatureGate } from '@/shared/ui/soon';
import { useToast } from '@/shared/ui/toast';

import { getWishlist, type WishlistPage } from '../api/wishlist-api';
import { setWishlisted } from '../state/wishlist-store';
import { WishlistRemoveButton } from './wishlist-remove-button';
import styles from './wishlist.module.css';

const wishlistHref = (page: number) =>
  page > 1 ? `${routes.accountWishlist}?page=${page}` : routes.accountWishlist;

// `fixture` renders a ready list without the API (dev preview and tests only).
export function WishlistView({ page = 1, fixture }: { page?: number; fixture?: WishlistPage }) {
  const text = messages.wishlist;
  const { show } = useToast();
  const router = useRouter();
  const [data, setData] = useState<WishlistPage | null>(fixture ?? null);
  const [isLoading, setLoading] = useState(!fixture);
  const [error, setError] = useState<ApiError | null>(null);
  const [removed, setRemoved] = useState<ReadonlySet<number>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (fixture) return;
    let isActive = true;
    void getWishlist(page)
      .then((result) => {
        if (!isActive) return;
        setData(result);
        setRemoved(new Set());
      })
      .catch((cause: unknown) => {
        if (isActive) {
          setError(cause instanceof ApiError ? cause : new ApiError({ kind: 'unknown' }));
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [fixture, page, reloadKey]);

  // Set in the handler, not in the effect, so the page shows the skeleton while the list is read again.
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const remove = useCallback(
    async (bookId: number) => {
      if (!data) return;
      setRemoved((current) => new Set(current).add(bookId));
      try {
        await setWishlisted(bookId, false);
      } catch (cause) {
        setRemoved((current) => {
          const next = new Set(current);
          next.delete(bookId);
          return next;
        });
        const message = cause instanceof ApiError ? getApiErrorMessage(cause) : text.removeError;
        show(message, { kind: 'error', closeLabel: text.close });
        return;
      }
      // The last book of this page is gone: show the previous page, or the books that moved up from the next one.
      const remaining = data.items.filter((item) => item.id !== bookId && !removed.has(item.id));
      if (remaining.length > 0) return;
      if (page > 1) router.replace(wishlistHref(page - 1));
      else if (data.hasNextPage) reload();
    },
    [data, page, reload, removed, router, show, text.close, text.removeError],
  );

  const visible = data ? data.items.filter((item) => !removed.has(item.id)) : [];
  const totalPages = data ? Math.ceil(data.totalCount / Math.max(data.pageSize, 1)) : 0;
  const count = data ? Math.max(data.totalCount - removed.size, 0) : 0;

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{text.title}</h1>
          {data && visible.length > 0 ? (
            <p className={styles.subtitle}>{text.count.replace('{count}', formatNumber(count))}</p>
          ) : null}
        </div>
        {data && visible.length > 0 ? (
          <div className={styles.headActions}>
            <FeatureGate feature="wishlist-clear" label={messages.site.soon}>
              <Button disabled leadingIcon="trash" variant="outline">
                {text.clearAll}
              </Button>
            </FeatureGate>
            <FeatureGate feature="wishlist-add-available" label={messages.site.soon}>
              <Button disabled leadingIcon="cart">
                {text.addAvailable}
              </Button>
            </FeatureGate>
          </div>
        ) : null}
      </header>

      {error?.code === 'email_not_confirmed' ? <UnconfirmedEmailBanner /> : null}

      {isLoading ? (
        <Skeleton shape="card" />
      ) : error && error.code !== 'email_not_confirmed' ? (
        <div className={styles.error} role="alert">
          <p>{text.loadError}</p>
          <p className={styles.errorDetail}>{getApiErrorMessage(error)}</p>
          <Button onClick={reload} variant="outline">
            {text.retry}
          </Button>
        </div>
      ) : visible.length > 0 && data ? (
        <>
          <h2 className={styles.srOnly}>{text.listLabel}</h2>
          <ul aria-label={text.listLabel} className={styles.grid}>
            {visible.map((item, index) => (
              <li className={styles.item} key={item.id}>
                <BookCard
                  book={item}
                  priority={index < 3}
                  removeSlot={
                    <WishlistRemoveButton
                      onRemove={() => void remove(item.id)}
                      title={item.title}
                    />
                  }
                />
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <Pagination
              buildHref={wishlistHref}
              label={messages.catalog.page.pagination.label}
              nextLabel={messages.catalog.page.pagination.next}
              page={data.page}
              previousLabel={messages.catalog.page.pagination.previous}
              totalPages={totalPages}
            />
          ) : null}
          <section className={styles.browse}>
            <div>
              <h2 className={styles.browseTitle}>{text.browseTitle}</h2>
              <p className={styles.browseText}>{text.browseDescription}</p>
            </div>
            <ButtonLink href={routes.books} trailingIcon="arrow">
              {text.browseAction}
            </ButtonLink>
          </section>
        </>
      ) : !error ? (
        <EmptyState
          action={<ButtonLink href={routes.books}>{text.emptyAction}</ButtonLink>}
          description={text.emptyDescription}
          icon="heart"
          title={text.emptyTitle}
        />
      ) : null}
    </section>
  );
}
