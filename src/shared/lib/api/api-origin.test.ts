import { afterEach, describe, expect, it, vi } from 'vitest';

import { defaultApiOrigin } from './api-origin';
import { createServerClient } from './server-client';

describe('API origin', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses the IPv4 default when no origin is configured', async () => {
    vi.stubEnv('API_ORIGIN', undefined);
    const fetch = vi.fn<(request: Request) => Promise<Response>>(async () =>
      Response.json({ status: 'ok' }),
    );
    await createServerClient({ fetch }).GET('/api/v1/ping');

    expect(defaultApiOrigin).toBe('http://127.0.0.1:5198');
    expect(fetch.mock.calls[0]?.[0]).toMatchObject({ url: `${defaultApiOrigin}/api/v1/ping` });
  });

  it('uses API_ORIGIN when configured', async () => {
    vi.stubEnv('API_ORIGIN', 'https://api.example.test/');
    const fetch = vi.fn<(request: Request) => Promise<Response>>(async () =>
      Response.json({ status: 'ok' }),
    );
    await createServerClient({ fetch }).GET('/api/v1/ping');

    expect(fetch.mock.calls[0]?.[0]).toMatchObject({ url: 'https://api.example.test/api/v1/ping' });
  });
});
