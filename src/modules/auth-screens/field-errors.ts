import type { ApiError } from '@/shared/lib/api';

// The API names validation fields in PascalCase or camelCase ("Email", "email"); the forms use camelCase names.
export function mapFieldErrors(error: ApiError, fields: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, messages] of Object.entries(error.errors)) {
    const name = key.charAt(0).toLowerCase() + key.slice(1);
    const first = messages[0];

    if (first && fields.includes(name)) {
      result[name] = first;
    }
  }

  return result;
}

// Moves focus to the first field (in screen order) that has an error.
export function focusFirstInvalid(
  form: HTMLFormElement | null,
  order: readonly string[],
  errors: Record<string, string | undefined>,
) {
  const first = order.find((name) => errors[name]);

  if (!first) {
    return false;
  }

  form?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();

  return true;
}
