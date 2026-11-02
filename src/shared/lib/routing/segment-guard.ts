export type SegmentRule = { readonly maxLength: number; readonly pattern?: RegExp };

export const BOOK_SEGMENT_MAX_LENGTH = 350;
export const AUTHOR_SEGMENT_MAX_LENGTH = 200;
export const CATEGORY_SEGMENT_MAX_LENGTH = 200;
export const PAGE_KEY_MAX_LENGTH = 50;

export const segmentRules: Readonly<Record<string, SegmentRule>> = {
  books: { maxLength: BOOK_SEGMENT_MAX_LENGTH },
  authors: { maxLength: AUTHOR_SEGMENT_MAX_LENGTH },
  categories: { maxLength: CATEGORY_SEGMENT_MAX_LENGTH },
  pages: { maxLength: PAGE_KEY_MAX_LENGTH, pattern: /^[a-z0-9-]+$/ },
};

export function isValidSegment(rawSegment: string, rule: SegmentRule): boolean {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawSegment);
  } catch {
    return false;
  }

  if (
    !decoded.trim() ||
    decoded.length > rule.maxLength ||
    decoded.includes('/') ||
    decoded.includes('\\')
  ) {
    return false;
  }
  for (const character of decoded) {
    const code = character.charCodeAt(0);
    if (code <= 31 || code === 127) return false;
  }
  return rule.pattern ? rule.pattern.test(decoded) : true;
}
