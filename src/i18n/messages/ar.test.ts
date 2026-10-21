import { describe, expect, it } from 'vitest';

import messages from './ar.json';

// Keys (dot paths, or prefixes ending in ".") whose value is intentionally not Arabic.
const englishAllowList: readonly string[] = [
  'devComponents.field.filledValue', // dev-page sample input value
  'devComponents.field.invalidValue', // dev-page sample input value
  'site.header.english', // the name of the English language option, written in English on purpose
];

type Entry = { path: string; value: string };

function collect(node: unknown, path: string, out: Entry[]) {
  if (typeof node === 'string') {
    out.push({ path, value: node });
  } else if (Array.isArray(node)) {
    node.forEach((item, index) => collect(item, `${path}[${index}]`, out));
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([key, child]) =>
      collect(child, path ? `${path}.${key}` : key, out),
    );
  }
}

const entries: Entry[] = [];
collect(messages, '', entries);

const isAllowed = (path: string) =>
  englishAllowList.some((rule) => path === rule || (rule.endsWith('.') && path.startsWith(rule)));

describe('ar.json encoding guard', () => {
  it('has no run of question marks or replacement characters (a lost encoding)', () => {
    const bad = entries.filter(({ value }) => /\?{2,}|\uFFFD/u.test(value)).map((e) => e.path);

    expect(bad).toEqual([]);
  });

  it('has Arabic letters in every value that has Latin letters only', () => {
    const bad = entries
      .filter(({ path, value }) => !isAllowed(path) && /[A-Za-z]/.test(value))
      .filter(({ value }) => !/\p{Script=Arabic}/u.test(value))
      .map((e) => e.path);

    expect(bad).toEqual([]);
  });
});
