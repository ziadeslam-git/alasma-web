import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { formatNumber } from '@/shared/lib/format';
import { ButtonLink } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Pagination } from '@/shared/ui/pagination';

import type { CatalogData, CategoryNode } from '../types';
import { buildCatalogHref, clearFilters, countActiveFilters, withPage } from '../url/catalog-href';
import type { CatalogParams } from '../url/catalog-params';
import { ActiveFilterChips } from './active-filter-chips';
import { BookGrid } from './book-grid';
import styles from './catalog-view.module.css';
import { FilterPanel } from './filter-panel';
import { SortSelect } from './sort-select';

export type CatalogViewProps = {
  basePath?: string;
  data: CatalogData;
  isLoading?: boolean;
  params: CatalogParams;
};

function findCategoryName(
  nodes: readonly CategoryNode[],
  slug: string | undefined,
): string | undefined {
  if (!slug) {
    return undefined;
  }

  for (const node of nodes) {
    if (node.slug === slug || String(node.id) === slug) {
      return node.name;
    }
    const childMatch = findCategoryName(node.children, slug);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
}

function resolveHeadingText(categories: readonly CategoryNode[], params: CatalogParams): string {
  const text = messages.catalog.page;
  const categoryName = findCategoryName(categories, params.category);
  if (categoryName) {
    return categoryName;
  }
  if (params.q) {
    return text.searchHeading.replace('{query}', params.q);
  }
  return text.heading;
}

// Server Component assembling the public catalog page (/books): filter sidebar / mobile drawer, header with active
// category or search title, result count, sort select, active filter chips, book grid or empty/invalid/error states,
// and pagination. Does not render a <main> because SiteShell owns the page's single <main>.
export function CatalogView({
  basePath = routes.books,
  data,
  isLoading = false,
  params,
}: CatalogViewProps) {
  const text = messages.catalog.page;
  const headingText = resolveHeadingText(data.options.categories, params);
  const { books, options } = data;
  const hasActiveCriteria = countActiveFilters(params) > 0 || params.q !== undefined;
  const resetHref = buildCatalogHref(basePath, { ...clearFilters(params), q: undefined });
  const retryHref = buildCatalogHref(basePath, params);
  const shouldShowResultCount = !isLoading && (books.status === 'ok' || books.status === 'empty');

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <div className={styles.filterColumn}>
          <FilterPanel basePath={basePath} options={options} params={params} />
        </div>

        <section aria-labelledby="catalog-heading" className={styles.results}>
          <header className={styles.topBar}>
            <div className={styles.headingGroup}>
              <h1 className={styles.heading} id="catalog-heading">
                {headingText}
              </h1>
              {shouldShowResultCount ? (
                <p className={styles.resultCount} data-testid="catalog-result-count">
                  {text.resultsCount.replace('{count}', formatNumber(books.totalCount))}
                </p>
              ) : null}
            </div>

            <div className={styles.controlsBar}>
              <SortSelect basePath={basePath} params={params} />
            </div>
          </header>

          <ActiveFilterChips basePath={basePath} options={options} params={params} />

          <h2 className={styles.srOnly} id="catalog-results-heading">
            {text.resultsAriaLabel}
          </h2>

          {isLoading ? (
            <BookGrid isLoading items={[]} />
          ) : books.status === 'ok' ? (
            <>
              <BookGrid items={books.items} />
              {books.totalPages > 1 ? (
                <div className={styles.paginationWrap}>
                  <Pagination
                    buildHref={(page) => buildCatalogHref(basePath, withPage(params, page))}
                    label={text.pagination.label}
                    nextLabel={text.pagination.next}
                    page={books.page}
                    previousLabel={text.pagination.previous}
                    totalPages={books.totalPages}
                  />
                </div>
              ) : null}
            </>
          ) : books.status === 'empty' ? (
            hasActiveCriteria ? (
              <EmptyState
                action={
                  <ButtonLink href={resetHref} variant="outline">
                    {text.resetFilters}
                  </ButtonLink>
                }
                description={text.filteredEmptyDescription}
                icon="search"
                title={text.filteredEmptyTitle}
                variant="search"
              />
            ) : (
              <BookGrid items={[]} />
            )
          ) : books.status === 'invalid' ? (
            <EmptyState
              action={
                <ButtonLink href={resetHref} variant="primary">
                  {text.resetFilters}
                </ButtonLink>
              }
              description={text.invalidFiltersDescription}
              icon="filter"
              title={text.invalidFiltersTitle}
              variant="search"
            />
          ) : (
            <EmptyState
              action={
                <ButtonLink href={retryHref} variant="outline">
                  {text.retry}
                </ButtonLink>
              }
              description={text.errorDescription}
              icon="help"
              title={text.errorTitle}
              variant="error"
            />
          )}
        </section>
      </div>
    </div>
  );
}
