import { MAX_BOOK_SLUG_LENGTH } from './catalog-params';
import { normalizeSlug } from './normalize-slug';

export { MAX_BOOK_SLUG_LENGTH };

export function normalizeBookSlug(raw: string | undefined): string | undefined {
  return normalizeSlug(raw, MAX_BOOK_SLUG_LENGTH);
}
