// The real-API e2e port guard, pure on purpose (no network, file system or process): playwright.config.ts, the
// real-API helpers and the specs that spawn their own API all take the port from here, so one rule covers them all.
// 5391 is only the internal port where a spec spawns its OWN isolated API. 5198 is the main backend on the main
// database and must never be used by e2e, whatever else is set.
export const DEFAULT_API_PORT = 5391;
export const MAIN_BACKEND_PORT = 5198;

type Env = Record<string, string | undefined>;

// Strict: an unset variable gives the default; anything else must be a plain integer from 1 to 65535 (so "", "0",
// "70000", "abc" and "5391x" are errors, never silently the default).
export function parseApiPort(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_API_PORT;
  }
  if (!/^\d{1,5}$/.test(raw)) {
    throw new Error(`E2E_API_PORT must be an integer from 1 to 65535 (got "${raw}").`);
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    throw new Error(`E2E_API_PORT must be an integer from 1 to 65535 (got "${raw}").`);
  }
  return port;
}

export function assertSafeApiPort(port: number): number {
  if (port === MAIN_BACKEND_PORT) {
    throw new Error(
      `Refusing to run e2e against port ${MAIN_BACKEND_PORT}: it is the main backend on the main database. ` +
        `Use the isolated API port (default ${DEFAULT_API_PORT}); this applies even with E2E_REUSE_API=1.`,
    );
  }
  return port;
}

export function resolveApiPort(env: Env = process.env): number {
  return assertSafeApiPort(parseApiPort(env.E2E_API_PORT));
}

// Reusing an API that is already running is an explicit opt-in: its database and mail settings are not known here.
export function isApiReuseAllowed(env: Env = process.env): boolean {
  return env.E2E_REUSE_API === '1';
}
