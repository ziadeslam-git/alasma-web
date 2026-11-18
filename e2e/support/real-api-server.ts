import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

import { expect } from '@playwright/test';

// The real-API e2e convention, in one place: opt in with E2E_REAL_API=1, and the spec starts its OWN API with
// `dotnet run` on E2E_API_PORT (default 5391) from the sibling backend folder. The connection string and the blank
// Smtp__* values come from the environment of the command that runs Playwright (never from a file), so the API uses the
// isolated AlAsmaPro_FrontendDev database. Playwright points the `next dev` server on 3101 at this API
// (playwright.config.ts), which is why real-API specs use webOrigin as their baseURL.
export const isRealApiEnabled = process.env.E2E_REAL_API === '1';
export const realApiSkipReason = 'Set E2E_REAL_API=1 to run against the real API.';
export const apiPort = Number(process.env.E2E_API_PORT ?? 5391);
export const apiOrigin = `http://localhost:${apiPort}`;
export const webOrigin = 'http://localhost:3101';

const apiDir = resolve(process.env.E2E_API_DIR ?? '../AlAsmaPro');

// Without ConnectionStrings__Default the API falls back to the developer's user-secrets: their MAIN database, and real
// Smtp and Cloudinary settings. A spec that spawns an API therefore refuses to start unless that variable names an
// isolated "..._FrontendDev" database (the backend's docs/frontend-dev-setup.md). The message never contains the value.
export function assertIsolatedDatabase() {
  const connection = process.env.ConnectionStrings__Default ?? '';
  if (!/(?:database|initial catalog)\s*=\s*[^;]*_FrontendDev\s*(?:;|$)/i.test(connection)) {
    throw new Error(
      'Refusing to start the API: ConnectionStrings__Default must be set (inline, per command) to an isolated ' +
        'database whose name ends with _FrontendDev. Without it the API would use the main development database.',
    );
  }
}

// Mail and image uploads are always blank for a spawned API, whatever the caller's environment or user-secrets hold.
export const blankExternalServices = {
  Smtp__FromAddress: '',
  Smtp__Password: '',
  Smtp__UserName: '',
  Cloudinary__CloudName: '',
  Cloudinary__ApiKey: '',
  Cloudinary__ApiSecret: '',
} as const;

let api: ChildProcess | undefined;
let apiLog = '';

// Reuses an API that already answers on E2E_API_PORT, otherwise spawns an isolated one and waits until it listens.
export async function startRealApi() {
  try {
    const probe = await fetch(`${apiOrigin}/api/v1/sitemap`);
    if (probe.ok) {
      return;
    }
  } catch {
    // Not running yet; spawn our own isolated API instance.
  }

  // The module stays loaded across spec files in one worker: without clearing the log, the readiness poll below matched
  // the "Now listening on" of the PREVIOUS file's (already stopped) API and returned before this one listened, so the
  // next spec met ECONNREFUSED (seen as a 500 on /books/zz-no-such-book, Task 72).
  apiLog = '';
  assertIsolatedDatabase();
  api = spawn(
    'dotnet',
    ['run', '--project', 'src/AlAsmaPro.Api', '--no-launch-profile', '--urls', apiOrigin],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        ...blankExternalServices,
        ASPNETCORE_ENVIRONMENT: 'Development',
        Cors__AllowedOrigins__0: 'http://localhost:3000',
        Cors__AllowedOrigins__1: webOrigin,
      },
    },
  );
  const collect = (chunk: Buffer) => {
    apiLog += chunk.toString();
  };
  api.stdout?.on('data', collect);
  api.stderr?.on('data', collect);

  await expect
    .poll(() => apiLog.includes('Now listening on'), { intervals: [500], timeout: 180_000 })
    .toBe(true);
}

export function stopRealApi() {
  const pid = api?.pid;
  if (pid === undefined) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  } else {
    api?.kill('SIGTERM');
  }
}
