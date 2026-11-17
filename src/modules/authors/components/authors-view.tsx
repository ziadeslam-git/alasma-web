import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { EmptyState } from '@/shared/ui/empty-state';
import { Pagination } from '@/shared/ui/pagination';
import { RetryButton } from '@/shared/ui/retry-button';
import type { AuthorsResult } from '../api/authors';
import { AuthorCard } from './author-card';
import styles from './authors.module.css';
export function AuthorsView({ result, page }: { result: AuthorsResult; page: number }) {
  const text = messages.authors;
  const data = result.status === 'ok' ? result.data : null;
  const totalPages = data?.totalPages ?? (data ? Math.ceil(data.totalCount / data.pageSize) : 0);
  return (
    <div className={styles.container}>
      <h1>{messages.site.header.authors}</h1>
      {data && data.items.length ? (
        <>
          <div className={styles.grid}>
            {data.items.map((author) => (
              <AuthorCard author={author} key={author.id} />
            ))}
          </div>
          {totalPages > 1 ? (
            <Pagination
              buildHref={(n) => (n === 1 ? routes.authors : `${routes.authors}?page=${n}`)}
              label={messages.catalog.page.pagination.label}
              nextLabel={messages.catalog.page.pagination.next}
              previousLabel={messages.catalog.page.pagination.previous}
              page={page}
              totalPages={totalPages}
            />
          ) : null}
        </>
      ) : result.status === 'error' ? (
        <EmptyState
          action={<RetryButton label={messages.site.loadError.retry} />}
          description={messages.site.loadError.description}
          icon="user"
          title={text.errorTitle}
          variant="error"
        />
      ) : (
        <EmptyState icon="user" title={text.emptyTitle} description={text.emptyDescription} />
      )}
    </div>
  );
}
