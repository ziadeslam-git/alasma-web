import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { CategoryNav } from './category-nav';
import { testFilterOptions, testText } from './filter-test-data';

const text = messages.catalog.filters.categoryNav;
const categories = testFilterOptions.categories;

describe('CategoryNav', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<CategoryNav categories={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders "all" plus one real link per top-level category, using the category route helper', () => {
    render(<CategoryNav categories={categories} />);

    const nav = screen.getByRole('navigation', { name: text.label });
    expect(within(nav).getByRole('link', { name: text.all })).toHaveAttribute('href', '/books');
    expect(within(nav).getByRole('link', { name: testText.fiction })).toHaveAttribute(
      'href',
      '/categories/novels',
    );
    expect(within(nav).getByRole('link', { name: testText.poetry })).toHaveAttribute(
      'href',
      `/categories/${encodeURIComponent(testText.poetry)}`,
    );
  });

  it('marks "all" as current when no category is active', () => {
    render(<CategoryNav categories={categories} />);

    expect(screen.getByRole('link', { name: text.all })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: testText.fiction })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks the active category with aria-current', () => {
    render(<CategoryNav activeSlug="novels" categories={categories} />);

    expect(screen.getByRole('link', { name: testText.fiction })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: text.all })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: testText.poetry })).not.toHaveAttribute('aria-current');
  });

  it('shows the sub-categories of the active branch and marks the parent when a child is active', () => {
    render(<CategoryNav activeSlug="mystery" categories={categories} />);

    expect(screen.getByRole('link', { name: testText.fiction })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const sub = screen.getByRole('list', { name: text.subLabel });
    expect(within(sub).getByRole('link', { name: testText.mystery })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(sub).getByRole('link', { name: testText.fantasy })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('matches the active category by numeric id too and shows no sub row for a leaf branch', () => {
    render(<CategoryNav activeSlug="2" categories={categories} />);

    expect(screen.getByRole('link', { name: testText.poetry })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('list', { name: text.subLabel })).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CategoryNav activeSlug="mystery" categories={categories} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
