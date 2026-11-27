// URL state <-> the query string of a list endpoint. One format for every admin list: camelCase keys (as the API
// has them), repeated keys for lists (`status=a&status=b`), keys sorted so the same state always gives the same URL,
// and nothing for an empty value (a filter that is not set is not in the URL).
export type QueryValue = string | number | boolean | Date | null | undefined;
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>;

function text(value: QueryValue): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();

  const result = String(value).trim();

  return result.length > 0 ? result : null;
}

export function buildQuery(params: QueryParams): string {
  const query = new URLSearchParams();

  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    const values = Array.isArray(value) ? (value as readonly QueryValue[]) : [value as QueryValue];

    for (const item of values) {
      const result = text(item);

      if (result !== null) query.append(key, result);
    }
  }

  return query.toString();
}

export type QueryShape = 'string' | 'number' | 'boolean' | 'string[]' | 'number[]';

type ParsedValue<S extends QueryShape> = S extends 'string'
  ? string
  : S extends 'number'
    ? number
    : S extends 'boolean'
      ? boolean
      : S extends 'string[]'
        ? string[]
        : number[];

export type ParsedQuery<T extends Record<string, QueryShape>> = {
  [K in keyof T]?: ParsedValue<T[K]>;
};

function toNumber(value: string): number | undefined {
  const result = Number(value);

  return value.trim() !== '' && Number.isFinite(result) ? result : undefined;
}

// The other direction: the URL (search string or URLSearchParams) -> typed state. A key that is missing or has a
// value of the wrong type is left out, so a hand-edited URL never breaks a screen.
export function parseQuery<T extends Record<string, QueryShape>>(
  search: string | URLSearchParams,
  shape: T,
): ParsedQuery<T> {
  const query = typeof search === 'string' ? new URLSearchParams(search) : search;
  const result: Record<string, unknown> = {};

  for (const [key, kind] of Object.entries(shape)) {
    const values = query.getAll(key).filter((value) => value.trim() !== '');

    if (values.length === 0) continue;

    if (kind === 'string') result[key] = values[0];
    if (kind === 'number') result[key] = toNumber(values[0] ?? '');
    if (kind === 'boolean' && (values[0] === 'true' || values[0] === 'false')) {
      result[key] = values[0] === 'true';
    }
    if (kind === 'string[]') result[key] = values;
    if (kind === 'number[]') {
      result[key] = values.map(toNumber).filter((value): value is number => value !== undefined);
    }
  }

  return Object.fromEntries(
    Object.entries(result).filter(([, value]) => value !== undefined),
  ) as ParsedQuery<T>;
}
