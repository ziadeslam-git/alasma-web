import { http, HttpResponse } from 'msw';

// Test-only request handlers. MSW is never started in the browser, in dev or in production.
// Add a handler here only for an endpoint that exists in the delivered backend (docs/openapi.json).
export const handlers = [
  http.get('http://localhost/api/v1/ping', () => HttpResponse.json({ status: 'ok' })),
];
