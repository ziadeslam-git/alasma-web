import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import type { BookCardItem } from '@/modules/catalog';
import { defaultApiOrigin } from '@/shared/lib/api';

import { RelatedBooks } from './related-books';

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));

const book: BookCardItem = {
  id: 99,
  slug: 'related-book',
  title: 'Related Book',
  coverImageUrl: null,
  authors: ['Author'],
  price: 130,
  finalPrice: 130,
  discountPercent: 0,
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: false,
};
const endpoint = `${defaultApiOrigin}/api/v1/books/:slug/related`;

describe('RelatedBooks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders the related section and book returned by the API', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json([book])));
    render(await RelatedBooks({ slug: 'found-related' }));
    expect(
      screen.getByRole('heading', { name: messages.catalog.detail.related.heading }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(book.title).length).toBeGreaterThanOrEqual(1);
  });

  it('omits the section for an empty result', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json([])));
    const { container } = render(await RelatedBooks({ slug: 'empty-related' }));
    expect(container).toBeEmptyDOMElement();
  });

  it('omits the section when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get(endpoint, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    const { container } = render(await RelatedBooks({ slug: 'failed-related' }));
    expect(console.error).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(book.title)).not.toBeInTheDocument();
  });
});
