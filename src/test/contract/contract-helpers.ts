import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import openapi from '@/shared/lib/api/openapi.json';

// Contract tests feed the backend's real response samples (read-only copies in
// src/test/fixtures/api-samples) through the real frontend code paths.
export const SAMPLES_DIR = join(process.cwd(), 'src', 'test', 'fixtures', 'api-samples');
export const ORIGIN = 'http://localhost:5198';

export function sample<T = unknown>(name: string): T {
  return JSON.parse(readFileSync(join(SAMPLES_DIR, name), 'utf8')) as T;
}

type Schema = {
  $ref?: string;
  type?: string | string[];
  enum?: unknown[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  oneOf?: Schema[];
  anyOf?: Schema[];
  format?: string;
};

type Spec = {
  components: { schemas: Record<string, Schema> };
  paths: Record<
    string,
    Record<string, { responses: Record<string, { content?: Record<string, { schema: Schema }> }> }>
  >;
};

const spec = openapi as unknown as Spec;

function resolve(schema: Schema): Schema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.replace('#/components/schemas/', '');
  const target = spec.components.schemas[name];
  if (!target) throw new Error(`Unknown schema ${schema.$ref}`);
  return target;
}

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// A small runtime check of a sample against the committed OpenAPI document (openapi.json, the same file the
// generated schema.d.ts comes from). Unknown properties are reported too: a field the API sends but the contract
// does not describe is as much a mismatch as a missing one.
export function schemaErrors(value: unknown, schema: Schema, at = '$'): string[] {
  const node = resolve(schema);

  if (node.oneOf || node.anyOf) {
    const options = node.oneOf ?? node.anyOf ?? [];
    const attempts = options.map((option) => schemaErrors(value, option, at));
    return attempts.some((errors) => errors.length === 0)
      ? []
      : [`${at}: matches none of the allowed shapes`];
  }

  const actual = typeOf(value);
  if (node.type) {
    const allowed = Array.isArray(node.type) ? node.type : [node.type];
    const isMatch = allowed.some((type) =>
      type === 'integer'
        ? typeof value === 'number' && Number.isInteger(value)
        : type === 'number'
          ? typeof value === 'number' && Number.isFinite(value)
          : type === actual,
    );
    if (!isMatch) return [`${at}: expected ${allowed.join('|')}, got ${actual}`];
  }

  if (node.enum && !node.enum.includes(value)) {
    return [`${at}: ${JSON.stringify(value)} is not one of ${node.enum.join(', ')}`];
  }
  if (node.format === 'date-time' && typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    return [`${at}: not a date-time`];
  }

  const errors: string[] = [];
  if (Array.isArray(value) && node.items) {
    value.forEach((item, index) =>
      errors.push(...schemaErrors(item, node.items!, `${at}[${index}]`)),
    );
  }
  if (actual === 'object' && node.properties) {
    const record = value as Record<string, unknown>;
    for (const key of node.required ?? []) {
      if (!(key in record)) errors.push(`${at}.${key}: required property is missing`);
    }
    for (const [key, item] of Object.entries(record)) {
      const child = node.properties[key];
      if (!child) errors.push(`${at}.${key}: property is not in the contract`);
      else errors.push(...schemaErrors(item, child, `${at}.${key}`));
    }
  }
  return errors;
}

// Validates a sample against the response schema of an endpoint, for example
// contractErrors('/api/v1/books/{slug}', 'get', '200', sample).
export function contractErrors(
  path: string,
  method: 'get' | 'post',
  status: string,
  value: unknown,
): string[] {
  const response = spec.paths[path]?.[method]?.responses[status];
  const content = response?.content ? Object.values(response.content)[0] : undefined;
  if (!content) throw new Error(`No ${status} body schema for ${method.toUpperCase()} ${path}`);
  return schemaErrors(value, content.schema);
}

// Text that must never reach a screen: leaked JS values and Arabic-Indic digits (the store shows Latin digits).
export function textProblems(container: HTMLElement): string[] {
  const text = container.textContent ?? '';
  const problems: string[] = [];
  if (/undefined/.test(text)) problems.push('contains "undefined"');
  if (/NaN/.test(text)) problems.push('contains "NaN"');
  if (/\bnull\b/.test(text)) problems.push('contains "null"');
  if (/[\u0660-\u0669\u06F0-\u06F9]/.test(text)) problems.push('contains non-Latin digits');
  return problems;
}
