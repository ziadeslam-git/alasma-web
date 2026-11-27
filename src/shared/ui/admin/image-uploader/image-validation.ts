// The contract (openapi) names the accepted image types and size only for the customer payment proof: JPEG, PNG or
// WebP of at most 5 MB. The admin image endpoints (books, authors, banners, events) do not document a limit, so the
// same one is used. A bigger file gets 413 from the server and is shown the same way.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPTED_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export type ImageIssue = 'type' | 'size' | 'empty';

// A pre-check for the user's comfort only: the API stays the judge (it also checks the real file content).
export function validateImageFile(
  file: File,
  options: { maxBytes?: number; acceptedTypes?: readonly string[] } = {},
): ImageIssue | null {
  const { maxBytes = IMAGE_MAX_BYTES, acceptedTypes = IMAGE_ACCEPTED_TYPES } = options;

  if (!acceptedTypes.includes(file.type)) return 'type';
  if (file.size === 0) return 'empty';
  if (file.size > maxBytes) return 'size';

  return null;
}
