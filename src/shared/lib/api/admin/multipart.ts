import type { components } from '../schema';

// The generated types describe a file as `null | string` (IFormFile). The real value is a Blob/File sent in a
// FormData. This is the one place that tells the type system so; the generated file itself is never edited.
export type FormFile = components['schemas']['IFormFile'];

export function asBlob(file: Blob | null | undefined): FormFile | null {
  return file ? (file as unknown as FormFile) : null;
}

// The multipart fields that carry JSON text in the contract (the generated type says `string`): the nested lists of
// the book and bundle forms.
export const MULTIPART_JSON_FIELDS = {
  book: ['authors', 'categories'],
  bundle: ['items'],
} as const;

export type FormFieldValue = string | number | boolean | Date | Blob | null | undefined;

export type BuildFormDataOptions = {
  // Fields whose value is an object or array that goes in as JSON text.
  jsonFields?: readonly string[];
};

function appendValue(form: FormData, name: string, value: unknown) {
  if (value === null || value === undefined) return;
  if (value instanceof Blob) {
    form.append(name, value);
    return;
  }
  if (value instanceof Date) {
    form.append(name, value.toISOString());
    return;
  }

  form.append(name, String(value));
}

// Builds the FormData of an admin multipart call. null and undefined are left out (the API reads a missing field as
// "not given"). An object that is not listed in `jsonFields` throws: guessing how to flatten it would send a
// wrong body without a sign.
export function buildFormData(
  fields: Record<string, unknown>,
  options: BuildFormDataOptions = {},
): FormData {
  const form = new FormData();
  const jsonFields = new Set(options.jsonFields ?? []);

  for (const [name, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;

    if (jsonFields.has(name)) {
      form.append(name, JSON.stringify(value));
      continue;
    }

    if (typeof value === 'object' && !(value instanceof Blob) && !(value instanceof Date)) {
      throw new TypeError(`multipart field "${name}" is an object: list it in jsonFields`);
    }

    appendValue(form, name, value);
  }

  return form;
}

// For openapi-fetch: the typed body is only a placeholder (it never describes a file correctly), and the real
// FormData goes in through the body serializer, so the browser sets the multipart boundary itself.
export function multipartOptions<T>(placeholder: T, form: FormData) {
  return { body: placeholder, bodySerializer: () => form };
}
