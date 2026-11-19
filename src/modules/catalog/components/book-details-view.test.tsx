import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { BookCardItem, BookDetails } from '../types';
import { BookDetailsView } from './book-details-view';

vi.mock('@/modules/cart', () => ({
  AddToCartButton: ({ title }: { title: string }) => <button type="button" aria-label={title} />,
}));

const sampleBook: BookDetails = {
  id: 1,
  slug: 'shadows-of-the-tale',
  title: 'ظلال الحكاية',
  description: 'وصف الكتاب الأول.',
  price: 150,
  finalPrice: 120,
  discountPercent: 20,
  pageCount: 320,
  publishYear: 2025,
  coverType: 'Hardcover',
  language: 'Arabic',
  isbn: '978-1-23456-789-0',
  coverImageUrl: null,
  images: [],
  authors: [
    {
      name: 'سامي الحكيم',
      role: 'Author',
      pageSlug: 'sami-al-hakim',
      shortBio: 'مؤلف معاصر.',
      displayOrder: 1,
    },
  ],
  publisher: {
    name: 'دار الأسمى',
    slug: 'al-asma',
    shortDescription: null,
  },
  categories: [
    {
      id: 10,
      name: 'الروايات',
      slug: 'novels',
      isPrimary: true,
    },
  ],
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: true,
  ratingCount: 3,
};

const sampleRelated: BookCardItem = {
  id: 2,
  slug: 'cairo-nights',
  title: 'ليالي القاهرة',
  coverImageUrl: null,
  authors: ['عمر الشريف'],
  price: 130,
  finalPrice: 130,
  discountPercent: 0,
  stockStatus: 'InStock',
  isNew: false,
  isFeatured: false,
};

describe('BookDetailsView: only what the API returns', () => {
  const text = messages.catalog.detail;

  it('shows no rating row and no invented numbers when ratingCount is 0', () => {
    const { container } = render(
      <BookDetailsView book={{ ...sampleBook, ratingAverage: null, ratingCount: 0 }} />,
    );

    expect(screen.queryByRole('img', { name: /التقييم/ })).toBeNull();
    expect(container).not.toHaveTextContent('4.8');
    expect(container).not.toHaveTextContent('2,400');
    expect(container).not.toHaveTextContent('تقييم');
  });

  it('hides the rating when there is a count but no average (and the reverse)', () => {
    const { container, rerender } = render(
      <BookDetailsView book={{ ...sampleBook, ratingAverage: null, ratingCount: 5 }} />,
    );

    expect(container).not.toHaveTextContent('تقييم');

    rerender(<BookDetailsView book={{ ...sampleBook, ratingAverage: 4.5, ratingCount: 0 }} />);

    expect(container).not.toHaveTextContent('تقييم');
  });

  it('shows the real average and count (Latin digits) when the book has ratings', () => {
    const { container } = render(
      <BookDetailsView book={{ ...sampleBook, ratingAverage: 4.5, ratingCount: 1200 }} />,
    );

    expect(screen.getByRole('img', { name: 'التقييم 4.5 من 5' })).toBeInTheDocument();
    expect(container).toHaveTextContent('4.5');
    expect(container).toHaveTextContent('1,200 تقييم');
  });

  it.each([
    ['Hardcover', text.specs.coverTypes.Hardcover, text.specs.coverTypes.Paperback],
    ['Paperback', text.specs.coverTypes.Paperback, text.specs.coverTypes.Hardcover],
  ] as const)(
    'offers only the real cover type (%s): no other format, no per-format price',
    (coverType, shown, other) => {
      render(<BookDetailsView book={{ ...sampleBook, coverType }} />);

      const group = screen.getByRole('group', { name: text.formats.legend });

      expect(group).toHaveTextContent(shown);
      expect(group).not.toHaveTextContent(other);
      expect(group).not.toHaveTextContent('إلكترونية');
      expect(group).not.toHaveTextContent(messages.catalog.currency);
      expect(group.children).toHaveLength(1);
    },
  );

  it('has no format group when the API sends no cover type', () => {
    render(<BookDetailsView book={{ ...sampleBook, coverType: null }} />);

    expect(screen.queryByRole('group', { name: text.formats.legend })).toBeNull();
  });

  it('writes the publish year without a thousands separator', () => {
    render(<BookDetailsView book={{ ...sampleBook, publishYear: 2020 }} />);

    const row = screen.getByRole('rowheader', { name: text.specs.publishYear }).closest('tr');

    expect(row).toHaveTextContent('2020');
    expect(row).not.toHaveTextContent('2,020');
  });

  it('renders none of the sections the API does not support (reviews, bundle, author bio, tags)', () => {
    const { container } = render(<BookDetailsView book={sampleBook} />);

    expect(screen.queryByText('آراء القراء')).toBeNull();
    expect(screen.queryByText('يُشترى معها')).toBeNull();
    expect(screen.queryByText('عن المؤلف')).toBeNull();
    expect(screen.queryByText('اكتب تقييمك')).toBeNull();
    expect(container).not.toHaveTextContent('#الروايات');
  });

  it('shows the designed cover (title and author) when the API sends no image', () => {
    render(<BookDetailsView book={{ ...sampleBook, coverImageUrl: null }} />);

    expect(screen.getAllByText(sampleBook.title).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('سامي الحكيم').length).toBeGreaterThanOrEqual(2);
  });
});

describe('BookDetailsView', () => {
  it('links author and category destinations and keeps the catalog breadcrumb live', () => {
    const { container } = render(
      <BookDetailsView book={sampleBook} relatedBooks={[sampleRelated]} />,
    );
    expect(container.querySelectorAll('a[href^="/authors/"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('a[href^="/categories/"]').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: messages.site.header.store })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(container.querySelector('a[href="/books/cairo-nights"]')).not.toBeNull();
  });
  it('renders exactly one h1 and passes axe', async () => {
    const { container } = render(<BookDetailsView book={sampleBook} />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('ظلال الحكاية');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders discounted price, struck original price with currency, and save badge', () => {
    render(<BookDetailsView book={sampleBook} />);

    expect(screen.getAllByText('120 ج.م').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('150 ج.م')).toBeInTheDocument();
    expect(screen.getByText('وفّر 20%')).toBeInTheDocument();
  });

  it('renders translator when contributor role is Translator', () => {
    const bookWithTranslator: BookDetails = {
      ...sampleBook,
      authors: [
        {
          name: 'سامي الحكيم',
          role: 'Author',
          pageSlug: 'sami-al-hakim',
          shortBio: null,
          displayOrder: 1,
        },
        {
          name: 'هدى مصطفى',
          role: 'Translator',
          pageSlug: null,
          shortBio: null,
          displayOrder: 2,
        },
      ],
    };

    render(<BookDetailsView book={bookWithTranslator} />);

    expect(screen.getByText(messages.catalog.detail.translatorPrefix.trim())).toBeInTheDocument();
    expect(screen.getAllByText('هدى مصطفى').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the low-stock label without a bell icon, which belongs to the notify-me action (Task 84)', () => {
    render(<BookDetailsView book={{ ...sampleBook, stockStatus: 'LowStock' }} />);

    const label = screen.getByText(messages.catalog.detail.stock.lowStock);
    expect(label.parentElement?.querySelector('svg')).toBeNull();
  });

  it('renders low-stock and out-of-stock badges correctly', () => {
    const { rerender } = render(
      <BookDetailsView book={{ ...sampleBook, stockStatus: 'LowStock' }} />,
    );
    expect(screen.getByText(messages.catalog.detail.stock.lowStock)).toBeInTheDocument();

    rerender(<BookDetailsView book={{ ...sampleBook, stockStatus: 'OutOfStock' }} />);
    expect(screen.getByText(messages.catalog.detail.stock.outOfStock)).toBeInTheDocument();
  });

  it('renders empty state when description is null', () => {
    render(<BookDetailsView book={{ ...sampleBook, description: null }} />);
    expect(screen.getByText(messages.catalog.detail.description.emptyTitle)).toBeInTheDocument();
  });

  it('omits rows in specifications table when fields are null or absent', () => {
    const bookSparse: BookDetails = {
      ...sampleBook,
      isbn: null,
      pageCount: null,
      publishYear: null,
      coverType: null,
      language: null,
      publisher: null,
    };

    render(<BookDetailsView book={bookSparse} />);

    expect(screen.queryByText(messages.catalog.detail.specs.isbn)).toBeNull();
    expect(screen.queryByText(messages.catalog.detail.specs.pageCount)).toBeNull();
    expect(screen.queryByText(messages.catalog.detail.specs.publishYear)).toBeNull();
  });

  it('renders related books section when related items are provided and omits it when empty', () => {
    const { rerender } = render(
      <BookDetailsView book={sampleBook} relatedBooks={[sampleRelated]} />,
    );
    expect(screen.getByText(messages.catalog.detail.related.heading)).toBeInTheDocument();
    expect(screen.getAllByText('ليالي القاهرة').length).toBeGreaterThanOrEqual(1);

    rerender(<BookDetailsView book={sampleBook} relatedBooks={[]} />);
    expect(screen.queryByText(messages.catalog.detail.related.heading)).toBeNull();
  });

  it('leaves the soon actions out of the page and keeps add to cart (Task 70)', () => {
    const detail = messages.catalog.detail;
    const { container } = render(<BookDetailsView book={sampleBook} />);

    for (const feature of [
      'buy-now',
      'wishlist-heart',
      'book-sample-pdf',
      'book-short-link',
      'book-report-error',
    ]) {
      expect(container.querySelector(`[data-feature="${feature}"]`)).toBeNull();
    }
    for (const label of [
      detail.actions.buyNow,
      detail.actions.sample,
      detail.actions.share,
      detail.extraOptions.heading,
      detail.extraOptions.samplePdf,
      detail.extraOptions.shortLink,
      detail.extraOptions.reportError,
    ]) {
      expect(screen.queryByText(label)).toBeNull();
    }
    expect(container.querySelector('[data-soon-badge]')).toBeNull();
    expect(screen.getByRole('button', { name: sampleBook.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: detail.specs.heading })).toBeInTheDocument();
  });

  it('keeps the ISBN in logical alignment: <bdi dir="ltr"> inside the cell, no dir on the cell itself (Task 76)', () => {
    const { container } = render(
      <BookDetailsView book={{ ...sampleBook, isbn: '978-3-16-148410-0' }} />,
    );
    const cell = screen.getByText('978-3-16-148410-0').closest('td')!;
    expect(cell).not.toHaveAttribute('dir');
    const wrapper = screen.getByText('978-3-16-148410-0');
    expect(wrapper.tagName).toBe('BDI');
    expect(wrapper).toHaveAttribute('dir', 'ltr');
    expect(container.querySelectorAll('td[dir]')).toHaveLength(0);
  });

  it('keeps the out-of-stock label and hides the notify-me action (Task 76)', () => {
    const { container } = render(
      <BookDetailsView book={{ ...sampleBook, stockStatus: 'OutOfStock' }} />,
    );
    expect(screen.getByText(messages.catalog.detail.stock.outOfStock)).toBeInTheDocument();
    expect(container.querySelector('[data-feature="reservations-notify-me"]')).toBeNull();
    expect(screen.queryByText(messages.catalog.detail.actions.notifyMe)).toBeNull();
  });
});
