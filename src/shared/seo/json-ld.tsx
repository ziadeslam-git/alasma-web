export type JsonLdNode = Record<string, unknown>;

const UNSAFE_JSON_LD_CHARS: Readonly<Record<string, string>> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Serialises structured data with JSON.stringify and replaces "<", ">", "&",
 * U+2028 and U+2029 with Unicode escape sequences so the payload can never break
 * out of a <script type="application/ld+json"> tag.
 */
export function serializeJsonLd(data: JsonLdNode | readonly JsonLdNode[]): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (char) => UNSAFE_JSON_LD_CHARS[char] ?? char,
  );
}

/**
 * Server component rendering a JSON-LD <script type="application/ld+json"> block.
 * Reason for dangerouslySetInnerHTML: React escapes text children inside <script>,
 * whereas JSON-LD must be raw JSON with "<", ">", "&", U+2028 and U+2029 Unicode-escaped.
 */
export function JsonLd({ data }: { data: JsonLdNode | readonly JsonLdNode[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
