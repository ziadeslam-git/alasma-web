import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { CategoriesView, getCategoryTree } from '@/modules/catalog';
import { routes } from '@/shared/config/routes';
import { buildPageMetadata } from '@/shared/seo';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: messages.seo.categoriesTitle,
  description: messages.seo.categoriesDescription,
  path: routes.categories,
});

export default async function CategoriesPage() {
  return <CategoriesView categories={await getCategoryTree()} />;
}
