import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { PRICE_DEBOUNCE_MS } from './price-range-filter';
import { FilterPanel } from './filter-panel';
import { makeParams, testFilterOptions, testText } from './filter-test-data';

const nav = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
}));

const text = messages.catalog.filters;
const scrollOff = { scroll: false };

function mount(params = makeParams(), basePath = '/books') {
  return render(<FilterPanel basePath={basePath} options={testFilterOptions} params={params} />);
}

const sidebar = () => within(screen.getByRole('complementary', { name: text.panelLabel }));

beforeEach(() => nav.replace.mockClear());

describe('FilterPanel sidebar', () => {
  it('is a landmark with an accessible name and one heading per group', () => {
    mount();

    expect(screen.getByRole('complementary', { name: text.panelLabel })).toBeInTheDocument();
    const groupHeadings = sidebar()
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(groupHeadings).toEqual([
      text.groups.category,
      text.groups.author,
      text.groups.price,
      text.groups.availability,
      text.groups.publisher,
      text.groups.language,
      text.groups.coverType,
      text.groups.rating,
    ]);
    expect(sidebar().getAllByRole('group').length).toBeGreaterThanOrEqual(5);
  });

  it('shows the selected state from the props only, including a numeric id', () => {
    const { rerender } = mount(makeParams({ category: 'mystery', inStock: true, publisher: '1' }));

    expect(sidebar().getByRole('radio', { name: testText.mystery })).toBeChecked();
    expect(sidebar().getByRole('radio', { name: testText.fiction })).not.toBeChecked();
    expect(sidebar().getByRole('checkbox', { name: text.groups.inStock })).toBeChecked();
    expect(sidebar().getByRole('checkbox', { name: text.groups.hasDiscount })).not.toBeChecked();
    expect(sidebar().getByRole('radio', { name: testText.publisherOne })).toBeChecked();

    rerender(<FilterPanel basePath="/books" options={testFilterOptions} params={makeParams()} />);
    expect(sidebar().getByRole('radio', { name: text.groups.categoryAll })).toBeChecked();
  });

  it('shows a value that is not in the list, checked, instead of an empty selection', () => {
    mount(makeParams({ author: 'someone-else' }));

    expect(sidebar().getByRole('radio', { name: 'someone-else' })).toBeChecked();
  });

  it('calls router.replace with exactly the expected href for each live control', async () => {
    mount(makeParams({ page: 3 }));

    await userEvent.click(sidebar().getByRole('radio', { name: testText.fiction }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?category=novels', scrollOff);

    await userEvent.click(sidebar().getByRole('radio', { name: testText.authorOne }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?author=sami-alhakim', scrollOff);

    await userEvent.click(sidebar().getByRole('radio', { name: testText.publisherOne }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?publisher=dar-al-asma', scrollOff);

    await userEvent.click(sidebar().getByRole('checkbox', { name: text.groups.inStock }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?inStock=true', scrollOff);

    await userEvent.click(sidebar().getByRole('checkbox', { name: text.groups.hasDiscount }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?hasDiscount=true', scrollOff);
    expect(nav.replace).toHaveBeenCalledTimes(5);
  });

  it('resets the page and encodes Arabic slugs', async () => {
    mount(makeParams({ page: 4, sort: 'title' }));

    await userEvent.click(sidebar().getByRole('radio', { name: testText.poetry }));

    expect(nav.replace).toHaveBeenCalledWith(
      `/books?category=${encodeURIComponent(testText.poetry)}&sort=title`,
      scrollOff,
    );
  });

  it('uses the base path it was given', async () => {
    mount(makeParams(), '/categories/novels');

    await userEvent.click(sidebar().getByRole('checkbox', { name: text.groups.inStock }));

    expect(nav.replace).toHaveBeenCalledWith('/categories/novels?inStock=true', scrollOff);
  });

  it('the "all" radio removes the filter and unchecking a switch turns it off', async () => {
    mount(makeParams({ category: 'novels', inStock: true }));

    await userEvent.click(sidebar().getByRole('radio', { name: text.groups.categoryAll }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?inStock=true', scrollOff);

    await userEvent.click(sidebar().getByRole('checkbox', { name: text.groups.inStock }));
    expect(nav.replace).toHaveBeenLastCalledWith('/books?category=novels', scrollOff);
  });

  it('filters the author list by text without navigating and keeps the selected author visible', async () => {
    mount(makeParams({ author: 'omar-alsharif' }));

    await userEvent.type(
      sidebar().getByRole('searchbox', { name: text.groups.authorSearch }),
      testText.authorOne,
    );

    expect(sidebar().getByRole('radio', { name: testText.authorOne })).toBeInTheDocument();
    expect(sidebar().getByRole('radio', { name: testText.authorTwo })).toBeChecked();
    expect(sidebar().queryByRole('radio', { name: testText.publisherOne })).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();

    await userEvent.type(sidebar().getByRole('searchbox'), 'zzz');
    expect(sidebar().getByText(text.groups.authorNone)).toBeInTheDocument();
  });

  it('clear all is shown only with active filters and keeps the search text and sort', async () => {
    const { unmount } = mount();
    expect(sidebar().queryByRole('button', { name: text.clearAll })).not.toBeInTheDocument();
    unmount();

    mount(makeParams({ q: 'x', sort: 'title', category: 'novels', minPrice: 5, page: 2 }));
    await userEvent.click(sidebar().getByRole('button', { name: text.clearAll }));

    expect(nav.replace).toHaveBeenCalledWith('/books?q=x&sort=title', scrollOff);
  });

  it('renders the unsupported groups inert, labelled and without any control or handler', () => {
    mount();

    for (const feature of [
      'filter-language',
      'filter-cover-type',
      'filter-rating',
      'filter-facet-counts',
    ]) {
      const gate = sidebar().getByText(
        (_, element) => element?.getAttribute('data-feature') === feature,
      );
      expect(gate).toHaveAttribute('inert');
      expect(gate).toHaveAttribute('aria-disabled', 'true');
      expect(gate).toHaveTextContent(messages.site.soon);
      expect(gate.querySelector('input, button, select, a, [onclick]')).toBeNull();
    }
  });

  it('has no accessibility violations empty and with filters applied', async () => {
    const { container, rerender } = mount();
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <FilterPanel
        basePath="/books"
        options={testFilterOptions}
        params={makeParams({ category: 'mystery', minPrice: 10, maxPrice: 90, inStock: true })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('price range', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const minField = () => sidebar().getByRole('textbox', { name: text.groups.priceMin });
  const maxField = () => sidebar().getByRole('textbox', { name: text.groups.priceMax });

  it('waits for the debounce and then applies one valid range', () => {
    mount();

    fireEvent.change(minField(), { target: { value: '6' } });
    fireEvent.change(minField(), { target: { value: '60' } });
    act(() => vi.advanceTimersByTime(PRICE_DEBOUNCE_MS - 1));
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith('/books?minPrice=60', scrollOff);
  });

  it('applies at once on Enter', () => {
    mount();

    fireEvent.change(minField(), { target: { value: '60' } });
    fireEvent.keyDown(minField(), { key: 'Enter' });
    expect(nav.replace).toHaveBeenLastCalledWith('/books?minPrice=60', scrollOff);
  });

  it('applies on blur', () => {
    mount(makeParams({ minPrice: 60 }));

    fireEvent.change(maxField(), { target: { value: '300' } });
    fireEvent.blur(maxField());
    expect(nav.replace).toHaveBeenCalledWith('/books?minPrice=60&maxPrice=300', scrollOff);
  });

  it('shows the Arabic error for an invalid number and never navigates', () => {
    mount();

    fireEvent.change(minField(), { target: { value: 'abc' } });
    fireEvent.keyDown(minField(), { key: 'Enter' });
    act(() => vi.advanceTimersByTime(PRICE_DEBOUNCE_MS * 2));

    expect(screen.getByText(text.errors.priceInvalid)).toBeInTheDocument();
    expect(minField()).toHaveAttribute('aria-invalid', 'true');
    expect(minField()).toHaveAccessibleDescription(text.errors.priceInvalid);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('rejects negative numbers and decimals with too many digits', () => {
    mount();

    fireEvent.change(minField(), { target: { value: '-5' } });
    fireEvent.keyDown(minField(), { key: 'Enter' });
    expect(screen.getByText(text.errors.priceInvalid)).toBeInTheDocument();

    fireEvent.change(minField(), { target: { value: '1.234' } });
    fireEvent.keyDown(minField(), { key: 'Enter' });
    expect(screen.getByText(text.errors.priceInvalid)).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('shows the range error when the minimum is above the maximum and never navigates', () => {
    mount();

    fireEvent.change(minField(), { target: { value: '300' } });
    fireEvent.change(maxField(), { target: { value: '100' } });
    fireEvent.keyDown(maxField(), { key: 'Enter' });
    act(() => vi.advanceTimersByTime(PRICE_DEBOUNCE_MS * 2));

    expect(screen.getByText(text.errors.priceRange)).toBeInTheDocument();
    expect(maxField()).toHaveAccessibleDescription(text.errors.priceRange);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('clears the error once the range is valid again', () => {
    mount();

    fireEvent.change(minField(), { target: { value: 'abc' } });
    fireEvent.keyDown(minField(), { key: 'Enter' });
    expect(screen.getByText(text.errors.priceInvalid)).toBeInTheDocument();

    fireEvent.change(minField(), { target: { value: '20' } });
    fireEvent.keyDown(minField(), { key: 'Enter' });

    expect(screen.queryByText(text.errors.priceInvalid)).not.toBeInTheDocument();
    expect(nav.replace).toHaveBeenLastCalledWith('/books?minPrice=20', scrollOff);
  });

  it('empties the range when both fields are cleared', () => {
    mount(makeParams({ minPrice: 10, maxPrice: 20, category: 'novels' }));

    fireEvent.change(minField(), { target: { value: '' } });
    fireEvent.change(maxField(), { target: { value: '' } });
    fireEvent.blur(maxField());

    expect(nav.replace).toHaveBeenLastCalledWith('/books?category=novels', scrollOff);
  });

  it('shows the numbers that arrive from the URL', () => {
    mount(makeParams({ minPrice: 60, maxPrice: 350.5 }));

    expect(minField()).toHaveValue('60');
    expect(maxField()).toHaveValue('350.5');
  });
});

describe('FilterPanel on mobile (drawer)', () => {
  const trigger = () => screen.getByRole('button', { name: new RegExp(`^${text.open}`) });

  it('shows the trigger without a badge when nothing is active', () => {
    mount();

    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByTestId('filter-count')).not.toBeInTheDocument();
  });

  it('shows the active-filter count in a badge and in the accessible name', () => {
    mount(
      makeParams({
        category: 'novels',
        minPrice: 5,
        maxPrice: 9,
        inStock: true,
        q: 'x',
        sort: 'title',
      }),
    );

    expect(screen.getByTestId('filter-count')).toHaveTextContent('3');
    expect(trigger()).toHaveAccessibleName(text.openWithCount.replace('{count}', '3'));
  });

  it('opens the sheet on a draft: nothing navigates until apply, which resets the page', async () => {
    mount(makeParams({ page: 5, sort: 'title' }));

    await userEvent.click(trigger());
    const dialog = await screen.findByRole('dialog', { name: text.title });
    await userEvent.click(within(dialog).getByRole('radio', { name: testText.fiction }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: text.groups.inStock }));
    expect(within(dialog).getByRole('radio', { name: testText.fiction })).toBeChecked();
    expect(nav.replace).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: text.apply }));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith(
      '/books?category=novels&inStock=true&sort=title',
      scrollOff,
    );
  });

  it('applies a price typed in the sheet without waiting for a debounce', async () => {
    mount();

    await userEvent.click(trigger());
    const dialog = await screen.findByRole('dialog', { name: text.title });
    await userEvent.type(within(dialog).getByRole('textbox', { name: text.groups.priceMax }), '99');
    await userEvent.click(within(dialog).getByRole('button', { name: text.apply }));

    expect(nav.replace).toHaveBeenCalledWith('/books?maxPrice=99', scrollOff);
  });

  it('clear all in the sheet empties the draft and applies on apply', async () => {
    mount(makeParams({ category: 'novels', inStock: true }));

    await userEvent.click(trigger());
    const dialog = await screen.findByRole('dialog', { name: text.title });
    await userEvent.click(within(dialog).getByRole('button', { name: text.clearAll }));
    expect(within(dialog).getByRole('radio', { name: text.groups.categoryAll })).toBeChecked();
    await userEvent.click(within(dialog).getByRole('button', { name: text.apply }));

    expect(nav.replace).toHaveBeenCalledWith('/books', scrollOff);
  });

  it('closes without navigating and starts from the URL again next time', async () => {
    mount(makeParams({ category: 'novels' }));

    await userEvent.click(trigger());
    let dialog = await screen.findByRole('dialog', { name: text.title });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: text.groups.hasDiscount }));
    await userEvent.click(within(dialog).getByRole('button', { name: text.close }));
    expect(nav.replace).not.toHaveBeenCalled();

    await userEvent.click(trigger());
    dialog = await screen.findByRole('dialog', { name: text.title });
    expect(
      within(dialog).getByRole('checkbox', { name: text.groups.hasDiscount }),
    ).not.toBeChecked();
  });

  it('has no accessibility violations with the sheet open', async () => {
    mount(makeParams({ category: 'novels' }));

    await userEvent.click(trigger());
    const dialog = await screen.findByRole('dialog', { name: text.title });

    expect(await axe(dialog)).toHaveNoViolations();
  });
});
