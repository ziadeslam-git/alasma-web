import { describe, expect, it } from 'vitest';

import {
  DEFAULT_API_PORT,
  assertSafeApiPort,
  isApiReuseAllowed,
  parseApiPort,
  resolveApiPort,
} from '../../e2e/support/real-api-port';

// Lives under src/ because `pnpm test` only collects src/**; the guard itself is in e2e/support and is pure.
describe('real-API e2e port guard', () => {
  it('uses the isolated default when E2E_API_PORT is unset', () => {
    expect(resolveApiPort({})).toBe(DEFAULT_API_PORT);
    expect(DEFAULT_API_PORT).toBe(5391);
  });

  it('accepts another valid port', () => {
    expect(resolveApiPort({ E2E_API_PORT: '5400' })).toBe(5400);
  });

  it('rejects the main backend port and names it', () => {
    expect(() => resolveApiPort({ E2E_API_PORT: '5198' })).toThrow(/5198.*main backend/);
    expect(() => assertSafeApiPort(5198)).toThrow(/5198/);
  });

  it('rejects the main backend port even with the reuse flag', () => {
    const env = { E2E_API_PORT: '5198', E2E_REUSE_API: '1' };
    expect(() => resolveApiPort(env)).toThrow(/5198/);
  });

  it.each(['', '0', '70000', '65536', 'abc', '5391x', ' 5391', '-1', '53.9'])(
    'rejects the invalid value %j',
    (value) => {
      expect(() => parseApiPort(value)).toThrow(/E2E_API_PORT/);
      expect(() => resolveApiPort({ E2E_API_PORT: value })).toThrow();
    },
  );

  it('accepts the range limits', () => {
    expect(parseApiPort('1')).toBe(1);
    expect(parseApiPort('65535')).toBe(65535);
  });

  it('allows reuse of a running API only with E2E_REUSE_API=1', () => {
    expect(isApiReuseAllowed({})).toBe(false);
    expect(isApiReuseAllowed({ E2E_REUSE_API: '' })).toBe(false);
    expect(isApiReuseAllowed({ E2E_REUSE_API: 'true' })).toBe(false);
    expect(isApiReuseAllowed({ E2E_REUSE_API: '1' })).toBe(true);
  });
});
