import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import {
  CatalogIntro,
  CatalogView,
  CategoryNav,
  getCatalogData,
  getCategory,
  getOutOfRangeHref,
  MAX_CATEGORY_SLUG_LENGTH,
  normalizeSlug,
  parseCatalogParams,
  type RawSearchParams,
} from '@/modules/catalog';
import { buildCategoryCatalogMetadata } from '@/modules/seo-site';
import { categoryRoute, routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<RawSearchParams> };

async function resolveCategory(params: Props['params']) {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw, MAX_CATEGORY_SLUG_LENGTH);
  if (!slug) notFound();
  const result = await getCategory(slug);
  if (result.kind === 'notFound') notFound();
  return { slug, category: result.category };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, category } = await resolveCategory(params);
  const rawParams = searchParams ? await searchParams : {};
  return buildCategoryCatalogMetadata(
    { name: category.name, slug, imageUrl: category.imageUrl },
    rawParams,
  );
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug, category } = await resolveCategory(params);
  const parsed = parseCatalogParams(searchParams ? await searchParams : {});
  const data = await getCatalogData({ ...parsed, category: slug });
  const viewParams = { ...parsed, category: undefined };
  const outOfRange = getOutOfRangeHref(data.books, viewParams, categoryRoute(slug));
  if (outOfRange) redirect(outOfRange);
  const children = category.children.map((child) => ({ ...child, imageUrl: null, children: [] }));
  const breadcrumb = [
    { label: messages.site.header.home, href: routes.home },
    ...category.breadcrumb.map((item) => ({ label: item.name, href: categoryRoute(item.slug) })),
  ];
  if (breadcrumb.at(-1)?.label !== category.name)
    breadcrumb.push({ label: category.name, href: categoryRoute(slug) });
  return (
    <>
      <CatalogIntro>
        <Breadcrumbs label={messages.catalog.filters.categoryNav.label} items={breadcrumb} />
        <CategoryNav categories={children} detailRoutes />
      </CatalogIntro>
      <CatalogView
        basePath={categoryRoute(slug)}
        data={data}
        heading={category.name}
        hideCategory
        params={viewParams}
      />
    </>
  );
}
