// Fails when a source file needs the client but does not start with the 'use client' directive.
// Why: a Server Component that imports a module using hooks, createContext or inline event handlers breaks the build and
// every page returns 500 (found in the Field primitives). The directive goes on the file that needs it, and only there.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

// not checked: tests and their helpers, type declarations, generated files, and MSW handlers
const skip = [
  /\.test\.tsx?$/,
  /\.d\.ts$/,
  /[\\/]src[\\/]test[\\/]/,
  /[\\/]src[\\/]mocks[\\/]/,
  /icon-registry\.ts$/,
];

const reactHooks = [
  'useState',
  'useEffect',
  'useReducer',
  'useContext',
  'useRef',
  'useCallback',
  'useMemo',
  'useLayoutEffect',
  'useId',
  'useTransition',
  'useOptimistic',
  'useSyncExternalStore',
  'useDeferredValue',
  'useImperativeHandle',
  'useInsertionEffect',
  'useActionState',
  'useFormStatus',
  'createContext',
];
const reactImport = new RegExp(
  String.raw`import\s*(?:type\s*)?\{[^}]*\b(?:${reactHooks.join('|')})\b[^}]*}\s*from\s*['"]react['"]`,
);
const hookCall = /\buse[A-Z]\w*\s*\(/; // any hook, including our own (useFieldContext) and next/navigation ones
const inlineHandler = /<[A-Za-z][\w.]*\b[^>]*\son[A-Z]\w*\s*=\s*\{/s;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !skip.some((pattern) => pattern.test(path)) ? [path] : [];
  });
}

const withoutComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');

function startsWithDirective(text) {
  // comments and blank lines may come first, nothing else
  return /^['"]use client['"];?/.test(withoutComments(text).trimStart());
}

const checked = files(src);
const failures = [];

for (const path of checked) {
  const text = readFileSync(path, 'utf8');
  const code = withoutComments(text);
  const reasons = [];
  if (reactImport.test(code)) reasons.push('imports a hook or createContext from react');
  if (hookCall.test(code)) reasons.push('calls a hook');
  if (inlineHandler.test(code)) reasons.push('has an inline event handler');
  if (reasons.length > 0 && !startsWithDirective(text)) {
    failures.push(
      `${relative(root, path)}: ${reasons.join(', ')} but does not start with 'use client'`,
    );
  }
}

if (failures.length > 0) {
  console.error(
    "check-use-client: these files need the 'use client' directive on their first line:",
  );
  failures.forEach((line) => console.error(`  - ${line}`));
  process.exit(1);
}

console.log(`check-use-client: ${checked.length} files checked, no missing 'use client'.`);
