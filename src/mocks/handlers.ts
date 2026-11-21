import { http, HttpResponse } from 'msw';
import { buildOrder, buildPayment } from '@/test/fixtures/orders';

const origin = 'http://localhost/api/v1';
const receiptPage = '<!doctype html><html lang="ar" dir="rtl"><body>receipt</body></html>';

// Test-only request handlers. MSW is never started in the browser, in dev or in production.
// Add a handler here only for an endpoint that exists in the delivered backend (docs/openapi.json).
export const handlers = [
  http.get(`${origin}/ping`, () => HttpResponse.json({ status: 'ok' })),
  // POST /orders/{id}/payment-proof: the order moves to PaymentReview with a Submitted payment.
  http.post(`${origin}/orders/:id/payment-proof`, () =>
    HttpResponse.json(
      buildOrder({ status: 'PaymentReview', payments: [buildPayment({ status: 'Submitted' })] }),
    ),
  ),
  // GET /orders/{id}/payments/{paymentId}/receipt: the printable HTML page of an approved payment.
  http.get(
    `${origin}/orders/:id/payments/:paymentId/receipt`,
    () =>
      new HttpResponse(receiptPage, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  ),
];
