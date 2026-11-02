import { CategoriesView, getCategoryTree } from '@/modules/catalog';

export const revalidate = 300;

export default async function CategoriesPage() {
  return <CategoriesView categories={await getCategoryTree()} />;
}
