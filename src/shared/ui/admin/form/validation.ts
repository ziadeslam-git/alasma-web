import messages from '@/i18n/messages/ar.json';

const copy = messages.admin.form;

// A rule gets the current value and returns an Arabic message, or null when the value is fine. The rules are built
// from the limits of the contract (lengths, ranges), one schema per form. There is no schema library in the project,
// so a schema is a plain object: one rule list per field.
export type Rule<Value> = (value: Value) => string | null;
export type FormSchema<Values> = { [Key in keyof Values]?: readonly Rule<Values[Key]>[] };
export type FormErrors<Values> = Partial<Record<keyof Values & string, string>>;

export function required<Value>(): Rule<Value> {
  return (value) => {
    if (value === null || value === undefined) return copy.required;
    if (typeof value === 'string' && value.trim().length === 0) return copy.required;
    if (Array.isArray(value) && value.length === 0) return copy.required;

    return null;
  };
}

export function maxLength(max: number): Rule<string> {
  return (value) => (value.length > max ? copy.maxLength.replace('{max}', String(max)) : null);
}

export function minLength(min: number): Rule<string> {
  return (value) =>
    value.trim().length > 0 && value.trim().length < min
      ? copy.minLength.replace('{min}', String(min))
      : null;
}

// For a number that may be empty (null). Empty is the job of `required`.
export function numberRange(min: number, max: number): Rule<number | null> {
  return (value) => {
    if (value === null) return null;

    return value < min || value > max
      ? copy.range.replace('{min}', String(min)).replace('{max}', String(max))
      : null;
  };
}

// For a date box: empty is fine (use `required` for that); a filled one must be a real YYYY-MM-DD day.
export function isoDate(): Rule<string> {
  return (value) => {
    if (value === '') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return copy.dateInvalid;

    const parsed = new Date(`${value}T00:00:00Z`);

    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
      ? copy.dateInvalid
      : null;
  };
}

export function maxItems<Item>(max: number): Rule<readonly Item[]> {
  return (value) => (value.length > max ? copy.maxItems.replace('{max}', String(max)) : null);
}

// The first failing rule of each field. A field with no entry in the schema is never checked.
export function validateForm<Values extends Record<string, unknown>>(
  values: Values,
  schema: FormSchema<Values>,
): FormErrors<Values> {
  const errors: FormErrors<Values> = {};

  for (const key of Object.keys(schema) as (keyof Values & string)[]) {
    const rules = schema[key] as readonly Rule<Values[typeof key]>[] | undefined;

    for (const rule of rules ?? []) {
      const message = rule(values[key]);

      if (message !== null) {
        errors[key] = message;
        break;
      }
    }
  }

  return errors;
}
