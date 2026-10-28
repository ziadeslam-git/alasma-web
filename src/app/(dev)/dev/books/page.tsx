import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import {
  CatalogView,
  parseCatalogParams,
  type CatalogBooksStatus,
  type CatalogData,
  type CatalogParams,
  type RawSearchParams,
} from '@/modules/catalog';

import { catalogFixtures } from '../catalog/catalog-fixtures';
import { filterFixtures } from '../catalog-filters/filter-fixtures';
import styles from './books-dev.module.css';

export const metadata: Metadata = {
  title: 'Books catalog (dev)',
  robots: { index: false, follow: false },
};

const BASE_PATH = '/dev/books';

const presets: ReadonlyArray<{ key: CatalogBooksStatus; href: string }> = [
  { key: 'ok', href: BASE_PATH },
  { key: 'empty', href: `${BASE_PATH}?state=empty&category=novels` },
  { key: 'invalid', href: `${BASE_PATH}?state=invalid` },
  { key: 'error', href: `${BASE_PATH}?state=error` },
];

function parseState(raw: string | string[] | undefined): CatalogBooksStatus {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'empty' || value === 'invalid' || value === 'error') {
    return value;
  }
  return 'ok';
}

function buildDevCatalogData(state: CatalogBooksStatus, params: CatalogParams): CatalogData {
  if (state === 'ok') {
    return {
      books: {
        status: 'ok',
        items: catalogFixtures,
        page: params.page,
        pageSize: 8,
        totalCount: 24,
        totalPages: 3,
      },
      options: filterFixtures,
    };
  }

  return {
    books: {
      status: state,
      items: [],
      page: params.page,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
    },
    options: filterFixtures,
  };
}

type DevBooksPageProps = {
  searchParams?: Promise<RawSearchParams>;
};

// Development reference page for the full /books CatalogView across ok, empty, invalid (400) and error (500) states.
// Returns 404 in production.
export default async function DevBooksPage({ searchParams }: DevBooksPageProps = {}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const rawParams = searchParams ? await searchParams : {};
  const state = parseState(rawParams.state);
  const params = parseCatalogParams(rawParams);
  const data = buildDevCatalogData(state, params);
  const text = messages.devBooks;

  return (
    <main className={styles.page} id="main-content">
      <nav aria-label={text.presetsLabel} className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <span className={styles.toolbarTitle}>{text.title}</span>
          <ul className={styles.presetList}>
            {presets.map((preset) => (
              <li key={preset.key}>
                <Link
                  aria-current={state === preset.key ? 'page' : undefined}
                  className={styles.presetLink}
                  href={preset.href}
                >
                  {text.presets[preset.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <CatalogView basePath={BASE_PATH} data={data} params={params} />
    </main>
  );
}
