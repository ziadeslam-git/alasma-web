import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';

// EXAMPLE (task F1.6): MSW in tests. A handler answers; a request without a handler fails the test.
describe('msw example', () => {
  it('answers a request from the shared handlers', async () => {
    const response = await fetch('http://localhost/api/v1/ping');

    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('answers a request from a handler added for this test only', async () => {
    server.use(http.get('http://localhost/api/v1/example', () => HttpResponse.json({ id: 7 })));

    const response = await fetch('http://localhost/api/v1/example');

    expect(await response.json()).toEqual({ id: 7 });
  });

  it('fails a request that has no handler', async () => {
    await expect(fetch('http://localhost/api/v1/not-mocked')).rejects.toThrow();
  });
});
