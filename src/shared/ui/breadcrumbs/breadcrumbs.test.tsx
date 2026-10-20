import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { Breadcrumbs, buildBreadcrumbListJsonLd } from './breadcrumbs';

const items = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { label: 'Current page' },
];

describe('Breadcrumbs', () => {
  it('renders the final item as the current page rather than a link', () => {
    render(<Breadcrumbs items={items} label="Breadcrumb" />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Current page' })).not.toBeInTheDocument();
    expect(screen.getByText('Current page')).toHaveAttribute('aria-current', 'page');
  });

  it('builds JSON-LD from the same item data', () => {
    expect(buildBreadcrumbListJsonLd(items, 'https://alasma.example')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', item: 'https://alasma.example/', name: 'Home', position: 1 },
        {
          '@type': 'ListItem',
          item: 'https://alasma.example/catalog',
          name: 'Catalog',
          position: 2,
        },
        { '@type': 'ListItem', item: 'https://alasma.example', name: 'Current page', position: 3 },
      ],
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Breadcrumbs items={items} label="Breadcrumb" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
