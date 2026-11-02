import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as featureConfig from '@/shared/config/features';
import { axe } from '@/test/axe';

import { FeatureGate, Soon } from './soon';
import { FeatureLink } from './feature-link';

describe('Soon', () => {
  it('keeps its children visible inside an inert, labelled wrapper', () => {
    render(
      <Soon feature="wishlist-heart" label="Soon">
        <button type="button">Action</button>
      </Soon>,
    );

    const wrapper = screen.getByText('Action').parentElement;

    expect(wrapper).toHaveAttribute('aria-disabled', 'true');
    expect(wrapper).toHaveAttribute('data-feature', 'wishlist-heart');
    expect(wrapper).toHaveAttribute('inert');
    expect(screen.getByText('Soon')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Soon badge="inline" feature="book-short-link" label="Soon">
        <span>Short link</span>
      </Soon>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('FeatureGate', () => {
  it('renders live features without a wrapper', () => {
    render(
      <FeatureGate feature="catalog-search" label="Soon">
        <button type="button">Search</button>
      </FeatureGate>,
    );

    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(document.querySelector('[data-feature="catalog-search"]')).toBeNull();
  });

  it('wraps soon features', () => {
    render(
      <FeatureGate feature="wishlist-heart" label="Soon">
        <span>Wishlist</span>
      </FeatureGate>,
    );

    expect(screen.getByText('Wishlist').parentElement).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders its fallback for a hidden feature state', () => {
    const stateSpy = vi.spyOn(featureConfig, 'getFeatureState').mockReturnValue('hidden');

    render(
      <FeatureGate fallback={<span>Fallback</span>} feature="wishlist-heart" label="Soon">
        <span>Hidden content</span>
      </FeatureGate>,
    );

    expect(screen.getByText('Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    stateSpy.mockRestore();
  });
});

describe('FeatureLink', () => {
  it('renders live destinations as links and deferred destinations without focusable links', () => {
    const { rerender, container } = render(
      <FeatureLink feature="catalog-search" href="/books" label="Soon">
        Store
      </FeatureLink>,
    );
    expect(screen.getByRole('link', { name: 'Store' })).toHaveAttribute('href', '/books');
    rerender(
      <FeatureLink feature="publish-packages" href="/publish" label="Soon">
        Categories
      </FeatureLink>,
    );
    const gate = container.querySelector('[data-feature="publish-packages"]');
    expect(gate).toHaveAttribute('inert');
    expect(gate?.querySelector('a, button, [tabindex]')).toBeNull();
    expect(gate).toHaveTextContent('Soon');
  });
});
