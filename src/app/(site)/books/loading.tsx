import {
  CatalogView,
  DEFAULT_CATALOG_PAGE_SIZE,
  emptyCatalogParams,
  type CatalogData,
} from '@/modules/catalog';

const loadingCatalogData: CatalogData = {
  books: {
    status: 'empty',
    items: [],
    page: 1,
    pageSize: DEFAULT_CATALOG_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  },
  options: {
    categories: [],
    authors: [],
    publishers: [],
  },
};

export default function BooksLoading() {
  return <CatalogView data={loadingCatalogData} isLoading params={emptyCatalogParams} />;
}
