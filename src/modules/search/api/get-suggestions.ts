import { getApiClient } from '@/modules/auth';
import type { components } from '@/shared/lib/api';

export type BookSuggestion = components['schemas']['BookSuggestionDto'];
export const MAX_SUGGESTIONS = 8;

export async function getSuggestions(q: string, signal: AbortSignal): Promise<BookSuggestion[]> {
  const result = await getApiClient().GET('/api/v1/search/suggest', {
    params: { query: { q } },
    signal,
  });
  return (result.data ?? []).slice(0, MAX_SUGGESTIONS);
}
