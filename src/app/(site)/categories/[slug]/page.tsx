import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import {
  CatalogView,
  CategoryNav,
  getCategory,
  getCatalogData,
  MAX_CATEGORY_SLUG_LENGTH,
  normalizeSlug,
  parseCatalogParams,
  type RawSearchParams,
} from '@/modules/catalog';
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await resolveCategory(params);
  return { title: category.name };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug, category } = await resolveCategory(params);
  const parsed = parseCatalogParams(searchParams ? await searchParams : {});
  const data = await getCatalogData({ ...parsed, category: slug });
  const viewParams = { ...parsed, category: undefined };
  const children = category.children.map((child) => ({ ...child, imageUrl: null, children: [] }));
  const breadcrumb = [
    { label: messages.site.header.home, href: routes.home },
    ...category.breadcrumb.map((item) => ({ label: item.name, href: categoryRoute(item.slug) })),
  ];
  if (breadcrumb.at(-1)?.label !== category.name)
    breadcrumb.push({ label: category.name, href: categoryRoute(slug) });
  return (
    <>
      <Breadcrumbs label={messages.catalog.filters.categoryNav.label} items={breadcrumb} />
      <CategoryNav categories={children} detailRoutes />
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
