// Fails when the committed schema.d.ts is not what openapi-typescript generates from the committed openapi.json.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contract = join(root, 'src', 'shared', 'lib', 'api', 'openapi.json');
const committed = join(root, 'src', 'shared', 'lib', 'api', 'schema.d.ts');
const folder = mkdtempSync(join(tmpdir(), 'alasma-api-'));
const generated = join(folder, 'schema.d.ts');

try {
  const cli = join(root, 'node_modules', 'openapi-typescript', 'bin', 'cli.js');
  execFileSync(process.execPath, [cli, contract, '-o', generated], { stdio: 'pipe' });

  if (!readFileSync(generated).equals(readFileSync(committed))) {
    console.error(
      'api:check: schema.d.ts is out of date. Run `pnpm api:types` and commit the result.',
    );
    process.exit(1);
  }

  console.log('api:check: schema.d.ts matches openapi.json.');
} finally {
  rmSync(folder, { recursive: true, force: true });
}
