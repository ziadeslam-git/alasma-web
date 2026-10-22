import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import {
  ActiveFilterChips,
  buildCatalogHref,
  CategoryNav,
  FilterPanel,
  parseCatalogParams,
  SortSelect,
  type RawSearchParams,
} from '@/modules/catalog';

import styles from './catalog-filters.module.css';
import { arabicCategorySlug, filterFixtures } from './filter-fixtures';

export const metadata: Metadata = {
  title: 'Catalog filters (dev)',
  robots: { index: false, follow: false },
};

const BASE_PATH = '/dev/catalog-filters';

// Preset URLs to try. The invalid one is written by hand on purpose (the helper would refuse to build it).
const presets = [
  { key: 'empty', href: BASE_PATH },
  { key: 'one', href: `${BASE_PATH}?category=novels` },
  {
    key: 'many',
    href: `${BASE_PATH}?category=mystery&author=sami-alhakim&publisher=dar-al-asma&minPrice=60&maxPrice=350&inStock=true&hasDiscount=true&sort=price_asc&page=2`,
  },
  {
    key: 'invalid',
    href: `${BASE_PATH}?category=${encodeURIComponent('javascript:alert(1)')}&minPrice=-5&maxPrice=abc&sort=popular&page=0&inStock=yes&unknown=1`,
  },
  { key: 'arabic', href: `${BASE_PATH}?category=${encodeURIComponent(arabicCategorySlug)}` },
] as const;

type PageProps = { searchParams: Promise<RawSearchParams> };

// Development reference page for the filter controls. The URL is the only state: changing a control changes the URL and
// this Server Component renders the selected state again. No API call. Returns 404 in production.
export default async function DevCatalogFiltersPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const text = messages.devCatalogFilters;
  const params = parseCatalogParams(await searchParams);
  const normalizedHref = buildCatalogHref(BASE_PATH, params);

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <h1 className={styles.title}>{text.title}</h1>
        <p className={styles.description}>{text.description}</p>
      </header>

      <nav aria-labelledby="presets-heading" className={styles.presets}>
        <h2 className={styles.heading} id="presets-heading">
          {text.presetsHeading}
        </h2>
        <ul className={styles.presetList}>
          {presets.map((preset) => (
            <li key={preset.key}>
              <Link className={styles.preset} href={preset.href}>
                {text.presets[preset.key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="categories-heading" className={styles.section}>
        <h2 className={styles.heading} id="categories-heading">
          {text.categoriesHeading}
        </h2>
        <CategoryNav activeSlug={params.category} categories={filterFixtures.categories} />
      </section>

      <div className={styles.layout}>
        <div>
          <FilterPanel basePath={BASE_PATH} options={filterFixtures} params={params} />
        </div>
        <div className={styles.content}>
          <section aria-labelledby="sort-heading" className={styles.section}>
            <h2 className={styles.heading} id="sort-heading">
              {text.sortHeading}
            </h2>
            <SortSelect basePath={BASE_PATH} params={params} />
          </section>
          <section aria-labelledby="chips-heading" className={styles.section}>
            <h2 className={styles.heading} id="chips-heading">
              {text.chipsHeading}
            </h2>
            <ActiveFilterChips basePath={BASE_PATH} options={filterFixtures} params={params} />
          </section>
          <section aria-labelledby="url-heading" className={styles.section}>
            <h2 className={styles.heading} id="url-heading">
              {text.currentUrl}
            </h2>
            <code className={styles.code} data-testid="normalized-url">
              {normalizedHref}
            </code>
          </section>
        </div>
      </div>
    </main>
  );
}
