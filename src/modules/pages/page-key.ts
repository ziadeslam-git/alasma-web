export const MAX_PAGE_KEY_LENGTH = 50;
export const PAGE_KEYS = [
  'about',
  'contact',
  'privacy-policy',
  'terms',
  'shipping-policy',
  'return-policy',
  'payment-methods',
  'faq',
] as const;
const pageKeyPattern = /^[a-z0-9-]+$/;

export function isPageKey(key: string | undefined): key is (typeof PAGE_KEYS)[number] {
  return (
    typeof key === 'string' &&
    key.length <= MAX_PAGE_KEY_LENGTH &&
    pageKeyPattern.test(key) &&
    PAGE_KEYS.some((allowed) => allowed === key)
  );
}
