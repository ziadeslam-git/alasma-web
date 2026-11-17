import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';
import type { CategoryNode } from '../types';

// 'error' is a failed load (5xx, network, timeout): the categories page shows an error state with a retry instead of
// "no categories". An empty 200 stays 'ok' with an empty list, shown as the empty state (Task 67).
export type CategoryTreeResult = { status: 'ok'; categories: CategoryNode[] } | { status: 'error' };

export async function getCategoryTree(
  options: ServerClientOptions = {},
): Promise<CategoryTreeResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/categories', {
      ...nextFetch({ revalidate: 300, tags: ['categories'] }),
    });
    return { status: 'ok', categories: throwIfError(result) };
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? String((error as { status: unknown }).status)
        : 'network';
    console.error(`[catalog] Failed to fetch the category tree (${status})`);
    return { status: 'error' };
  }
}
