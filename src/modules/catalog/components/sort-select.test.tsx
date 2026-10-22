import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { makeParams } from './filter-test-data';
import { SortSelect } from './sort-select';

const nav = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
}));

const text = messages.catalog.filters.sort;
const soon = messages.site.soon;

beforeEach(() => nav.replace.mockClear());

describe('SortSelect', () => {
  it('is a labelled native select that announces the current sort', () => {
    render(<SortSelect basePath="/books" params={makeParams({ sort: 'price_asc' })} />);

    const select = screen.getByRole('combobox', { name: text.label });
    expect(select).toHaveValue('price_asc');
    expect(screen.getByRole('option', { name: text.priceAsc, selected: true })).toBeInTheDocument();
  });

  it('offers the four supported sorts as enabled options', () => {
    render(<SortSelect basePath="/books" params={makeParams()} />);

    for (const [value, label] of [
      ['newest', text.newest],
      ['price_asc', text.priceAsc],
      ['price_desc', text.priceDesc],
      ['title', text.title],
    ]) {
      const option = screen.getByRole('option', { name: label });
      expect(option).toHaveValue(value);
      expect(option).toBeEnabled();
    }
  });

  it('shows the unsupported sorts of the design disabled with the soon text', () => {
    render(<SortSelect basePath="/books" params={makeParams()} />);

    for (const label of [text.popular, text.bestSelling, text.topRated]) {
      expect(screen.getByRole('option', { name: `${label} (${soon})` })).toBeDisabled();
    }
  });

  it('navigates through the URL helpers and resets the page', async () => {
    render(<SortSelect basePath="/books" params={makeParams({ category: 'novels', page: 4 })} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'price_desc');

    expect(nav.replace).toHaveBeenCalledWith('/books?category=novels&sort=price_desc', {
      scroll: false,
    });
  });

  it('picking the default sort removes it from the URL', async () => {
    render(<SortSelect basePath="/books" params={makeParams({ sort: 'title' })} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'newest');

    expect(nav.replace).toHaveBeenCalledWith('/books', { scroll: false });
  });

  it('does not navigate for a disabled option', async () => {
    render(<SortSelect basePath="/books" params={makeParams()} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), `${text.popular} (${soon})`);

    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SortSelect basePath="/books" params={makeParams()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
