import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { SAMPLES_DIR, contractErrors, sample, schemaErrors } from './contract-helpers';

// Type-level contract, checked at runtime: every sample must satisfy the response schema of its endpoint in the
// committed openapi.json (the file schema.d.ts is generated from).
const endpointBySample: Record<string, [path: string, status: string]> = {
  'author-house-demo-layla-mansour.json': ['/api/v1/authors/{slug}', '200'],
  'author-non-house-demo-hala-badr-404.json': ['/api/v1/authors/{slug}', '404'],
  'book-discounted-demo-book-002.json': ['/api/v1/books/{slug}', '200'],
  'book-low-stock-demo-book-014.json': ['/api/v1/books/{slug}', '200'],
  'book-out-of-stock-demo-book-010.json': ['/api/v1/books/{slug}', '200'],
  'books-featured.json': ['/api/v1/books/featured', '200'],
  'books-list-pageSize3.json': ['/api/v1/books', '200'],
  'books-new-arrivals.json': ['/api/v1/books/new-arrivals', '200'],
  'categories-tree.json': ['/api/v1/categories', '200'],
  'feature-flags-enabled.json': ['/api/v1/feature-flags/enabled', '200'],
  'pages-about.json': ['/api/v1/pages/{key}', '200'],
  'pages-contact.json': ['/api/v1/pages/{key}', '200'],
  'pages-faq.json': ['/api/v1/pages/{key}', '200'],
  'pages-payment-methods.json': ['/api/v1/pages/{key}', '200'],
  'pages-privacy-policy.json': ['/api/v1/pages/{key}', '200'],
  'pages-return-policy.json': ['/api/v1/pages/{key}', '200'],
  'pages-shipping-policy.json': ['/api/v1/pages/{key}', '200'],
  'pages-terms.json': ['/api/v1/pages/{key}', '200'],
  'payment-methods-dev-customer.json': ['/api/v1/payment-methods', '200'],
  'publishers.json': ['/api/v1/publishers', '200'],
  'shipping-zones.json': ['/api/v1/shipping/zones', '200'],
  'sitemap-trimmed-3.json': ['/api/v1/sitemap', '200'],
};

// Known, reported differences between a real sample and the contract (see the findings in the contract report).
// The test pins the exact difference, so it fails, and asks for this table to be updated, when the backend fixes it.
const knownDeviations: Record<string, string[]> = {
  // RFC 9457 extension members that ProblemDetails in openapi.json does not describe.
  'author-non-house-demo-hala-badr-404.json': [
    '$.traceId: property is not in the contract',
    '$.correlationId: property is not in the contract',
  ],
  // `details` is required (nullable) in PaymentMethodDto, but the real response leaves it out for CashOnDelivery.
  'payment-methods-dev-customer.json': ['$[0].details: required property is missing'],
};

describe('samples against the OpenAPI contract', () => {
  const files = readdirSync(SAMPLES_DIR).filter((name) => name.endsWith('.json'));

  it('maps every sample file to an endpoint', () => {
    expect(files.sort()).toEqual(Object.keys(endpointBySample).sort());
  });

  for (const [file, [path, status]] of Object.entries(endpointBySample)) {
    it(`${file} satisfies GET ${path} ${status}`, () => {
      expect(contractErrors(path, 'get', status, sample(file))).toEqual(
        knownDeviations[file] ?? [],
      );
    });
  }

  it('reports missing, mistyped and unknown fields (the checker itself works)', () => {
    const card = {
      ...sample<Record<string, unknown>[]>('books-featured.json')[0],
    };
    const schema = { $ref: '#/components/schemas/BookCardDto' };
    expect(schemaErrors(card, schema)).toEqual([]);
    expect(schemaErrors({ ...card, stockStatus: 'Gone' }, schema)).toHaveLength(1);
    expect(schemaErrors({ ...card, price: '12' }, schema)).toHaveLength(1);
    expect(schemaErrors({ ...card, extra: 1 }, schema)).toHaveLength(1);
    const withoutTitle: Record<string, unknown> = { ...card };
    delete withoutTitle.title;
    expect(schemaErrors(withoutTitle, schema)).toHaveLength(1);
  });
});
