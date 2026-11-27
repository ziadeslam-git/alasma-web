// The API sends and expects `rowVersion` as a base64 string in the JSON body (never in a header, never as an array of
// numbers). These helpers keep that one rule in one place.
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

// A value from a DTO (already base64) or raw bytes -> the base64 string for the body. Throws a RangeError for anything
// else, so a bad value is caught in the screen and never sent as an empty or broken concurrency token.
export function toRowVersion(value: string | Uint8Array | ArrayBuffer | null | undefined): string {
  if (value instanceof Uint8Array) {
    return toRowVersion(bytesToBase64(value));
  }

  if (value instanceof ArrayBuffer) {
    return toRowVersion(new Uint8Array(value));
  }

  const text = typeof value === 'string' ? value.trim() : '';

  if (text.length === 0 || text.length % 4 !== 0 || !BASE64_PATTERN.test(text)) {
    throw new RangeError('rowVersion must be a non-empty base64 string');
  }

  return text;
}
