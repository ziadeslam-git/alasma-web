import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { ActiveFilterChips } from './active-filter-chips';
import { makeParams, testFilterOptions, testText } from './filter-test-data';

const text = messages.catalog.filters;

function mount(params = makeParams(), basePath = '/books') {
  return render(
    <ActiveFilterChips basePath={basePath} options={testFilterOptions} params={params} />,
  );
}

describe('ActiveFilterChips', () => {
  it('renders nothing without active filters', () => {
    const { container } = mount();

    expect(container).toBeEmptyDOMElement();
  });

  it('shows one chip per active filter with the label from the option lists, not the raw slug', () => {
    mount(
      makeParams({
        q: 'ليالي',
        category: 'mystery',
        author: '2',
        publisher: 'dar-al-asma',
        minPrice: 60,
        maxPrice: 350,
        inStock: true,
        hasDiscount: true,
      }),
    );

    const group = screen.getByRole('region', { name: text.chips.label });
    const labels = within(group)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(labels).toEqual([
      text.chips.query.replace('{q}', 'ليالي'),
      testText.mystery,
      testText.authorTwo,
      testText.publisherOne,
      text.chips.priceBetween.replace('{min}', '60').replace('{max}', '350'),
      text.chips.inStock,
      text.chips.hasDiscount,
    ]);
    expect(group).not.toHaveTextContent('dar-al-asma');
  });

  it('writes half-open price ranges and falls back to the raw value for an unknown option', () => {
    mount(makeParams({ minPrice: 100, author: 'not-in-the-list' }));

    expect(screen.getByText(text.chips.priceFrom.replace('{min}', '100'))).toBeInTheDocument();
    expect(screen.getByText('not-in-the-list')).toBeInTheDocument();
  });

  it('each remove link goes to the href without that filter and resets the page', () => {
    mount(
      makeParams({
        category: 'novels',
        author: 'sami-alhakim',
        minPrice: 1,
        maxPrice: 2,
        sort: 'title',
        page: 4,
      }),
    );

    const hrefOf = (label: string) =>
      screen
        .getByRole('link', { name: text.chips.remove.replace('{label}', label) })
        .getAttribute('href');

    expect(hrefOf(testText.fiction)).toBe(
      '/books?author=sami-alhakim&minPrice=1&maxPrice=2&sort=title',
    );
    expect(hrefOf(testText.authorOne)).toBe(
      '/books?category=novels&minPrice=1&maxPrice=2&sort=title',
    );
    expect(hrefOf(text.chips.priceBetween.replace('{min}', '1').replace('{max}', '2'))).toBe(
      '/books?category=novels&author=sami-alhakim&sort=title',
    );
  });

  it('removing the search chip keeps the filters', () => {
    mount(makeParams({ q: 'x', category: 'novels' }));

    expect(
      screen.getByRole('link', {
        name: text.chips.remove.replace('{label}', text.chips.query.replace('{q}', 'x')),
      }),
    ).toHaveAttribute('href', '/books?category=novels');
  });

  it('clear all removes every filter but keeps the search text and sort', () => {
    mount(makeParams({ q: 'x', category: 'novels', inStock: true, sort: 'price_asc', page: 3 }));

    expect(screen.getByRole('link', { name: text.clearAll })).toHaveAttribute(
      'href',
      '/books?q=x&sort=price_asc',
    );
  });

  it('has no clear-all link when only the search text is set', () => {
    mount(makeParams({ q: 'x' }));

    expect(screen.queryByRole('link', { name: text.clearAll })).not.toBeInTheDocument();
  });

  it('encodes Arabic slugs in the remaining filters', () => {
    mount(makeParams({ category: testText.poetry, inStock: true }));

    expect(
      screen.getByRole('link', { name: text.chips.remove.replace('{label}', text.chips.inStock) }),
    ).toHaveAttribute('href', `/books?category=${encodeURIComponent(testText.poetry)}`);
  });

  it('has no accessibility violations', async () => {
    const { container } = mount(makeParams({ category: 'novels', minPrice: 5, inStock: true }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
