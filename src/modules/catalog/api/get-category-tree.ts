import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
} from '@/shared/lib/api';
import type { CategoryNode } from '../types';

export async function getCategoryTree(
  options: ServerClientOptions = {},
): Promise<CategoryNode[] | null> {
  try {
    const result = await createServerClient(options).GET('/api/v1/categories', {
      ...nextFetch({ revalidate: 300, tags: ['categories'] }),
    });
    return throwIfError(result);
  } catch {
    return null;
  }
}
