// Next.js fetch caching options for a Server Component call, in a typed form.
// Usage: client.GET('/api/v1/books/featured', { ...nextFetch({ revalidate: 600, tags: ['books'] }) }).
export type NextFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

export function nextFetch(options: NextFetchOptions): {
  requestInitExt: { next: NextFetchOptions };
} {
  return { requestInitExt: { next: options } };
}
