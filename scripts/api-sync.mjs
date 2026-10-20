// Copies the API contract from the backend repo into this one (byte for byte). Run when the backend changes.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '..', 'AlAsmaPro', 'docs', 'openapi.json');
const target = resolve(root, 'src', 'shared', 'lib', 'api', 'openapi.json');

if (!existsSync(source)) {
  console.error(`api:sync: the backend contract was not found at ${source}.`);
  console.error(
    'Clone or place the AlAsmaPro repo next to alasma-web, or keep the committed copy as it is.',
  );
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`api:sync: copied ${source} -> ${target}`);
