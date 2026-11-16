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

  api = spawn(
    'dotnet',
    ['run', '--project', 'src/AlAsmaPro.Api', '--no-launch-profile', '--urls', apiOrigin],
    {
      cwd: apiDir,
      env: {
        ...process.env,
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
