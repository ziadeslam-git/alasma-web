import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type TokenGroups = {
  colours: string[];
  shadows: string[];
  spacing: string[];
  radii: string[];
  fonts: string[];
  textClasses: string[];
};

const colourPrefixes = [
  'green-',
  'cream-',
  'brass-',
  'red-',
  'ink',
  'bg',
  'surface',
  'on-',
  'line',
  'primary',
  'accent',
  'discount',
  'success',
  'danger',
  'focus',
  'star',
  'chip',
  'overlay',
  'stage',
];

// Reads the tokens file itself, so the page can never drift from it. Development only.
export function readTokenGroups(): TokenGroups {
  const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
  const lightBlock = css.slice(0, css.indexOf('[data-theme="dark"]'));
  const variables = [
    ...new Set([...lightBlock.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1] ?? '')),
  ];
  const textClasses = [...css.matchAll(/^\.([a-z0-9-]+)\{/gm)].map((m) => m[1] ?? '');

  return {
    colours: variables.filter(
      (v) => !v.startsWith('shadow-') && colourPrefixes.some((p) => v.startsWith(p)),
    ),
    shadows: variables.filter((v) => v.startsWith('shadow-')),
    spacing: variables.filter((v) => v.startsWith('space-')),
    radii: variables.filter((v) => v.startsWith('radius-')),
    fonts: variables.filter((v) => v.startsWith('font-')),
    textClasses,
  };
}
