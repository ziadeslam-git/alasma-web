import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { axe } from '@/test/axe';

import { ORIGIN, sample, textProblems } from '@/test/contract/contract-helpers';

import { getAuthor } from '@/modules/authors/api/authors';
import { AuthorView } from '@/modules/authors/components/author-view';
import { BookGrid } from '@/modules/catalog/components/book-grid';
import { getPage } from '@/modules/pages/api/get-page';
import { PageView } from '@/modules/pages/components/page-view';
import { formatMoney } from '@/shared/lib/format';

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));

type AuthorSample = {
  name: string;
  fullBio: string;
  books: Array<{ title: string; finalPrice: number; slug: string }>;
};

describe('getAuthor and AuthorView', () => {
  it('renders the house author sample with its books', async () => {
    const body = sample<AuthorSample>('author-house-demo-layla-mansour.json');
    server.use(http.get(`${ORIGIN}/api/v1/authors/:slug`, () => HttpResponse.json(body)));
    const author = await getAuthor('demo-layla-mansour', { origin: ORIGIN });
    expect(author).not.toBeNull();
    if (!author) return;

    const { container } = render(
      <AuthorView author={author}>
        <BookGrid items={author.books} />
      </AuthorView>,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: body.name })).toBeVisible();
    expect(screen.getByText(body.fullBio)).toBeVisible();
    for (const book of body.books) {
      expect(screen.getByRole('link', { name: book.title })).toBeInTheDocument();
      expect(screen.getAllByText(formatMoney(book.finalPrice)).length).toBeGreaterThan(0);
    }
    expect(textProblems(container)).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('returns null for the non-house author 404 sample', async () => {
    server.use(
      http.get(`${ORIGIN}/api/v1/authors/:slug`, () =>
        HttpResponse.json(sample('author-non-house-demo-hala-badr-404.json'), {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      ),
    );
    expect(await getAuthor('demo-hala-badr', { origin: ORIGIN })).toBeNull();
  });
});

describe('getPage and PageView with the eight CMS page samples', () => {
  const files = [
    'pages-about.json',
    'pages-contact.json',
    'pages-faq.json',
    'pages-payment-methods.json',
    'pages-privacy-policy.json',
    'pages-return-policy.json',
    'pages-shipping-policy.json',
    'pages-terms.json',
  ];

  for (const file of files) {
    it(`renders ${file}`, async () => {
      const body = sample<{ key: string; title: string; body: string }>(file);
      server.use(http.get(`${ORIGIN}/api/v1/pages/:key`, () => HttpResponse.json(body)));
      const result = await getPage(body.key, { origin: ORIGIN });
      expect(result.kind).toBe('ok');
      if (result.kind !== 'ok') return;

      const { container } = render(<PageView page={result.page} />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1, name: body.title })).toBeVisible();
      // The samples carry plain text, so the body must show and the empty state must not.
      expect(screen.getByText(body.body)).toBeVisible();
      expect(screen.queryByText(messages.pages.emptyTitle)).toBeNull();
      expect(textProblems(container)).toEqual([]);
      expect(await axe(container)).toHaveNoViolations();
    });
  }
});
