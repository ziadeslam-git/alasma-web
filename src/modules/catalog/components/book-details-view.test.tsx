import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import type { BookCardItem, BookDetails } from '../types';
import { BookDetailsView } from './book-details-view';

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

describe('BookDetailsView', () => {
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
});
