import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';
import messages from '@/i18n/messages/ar.json';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders the static-page and catalog links with server-computed copyright year', () => {
    render(<SiteFooter />);

    for (const [key, path] of [
      ['about', 'about'],
      ['contact', 'contact'],
      ['privacy', 'privacy-policy'],
      ['terms', 'terms'],
      ['shipping', 'shipping-policy'],
      ['returns', 'return-policy'],
      ['payment', 'payment-methods'],
      ['faq', 'faq'],
    ] as const) {
      expect(screen.getByRole('link', { name: messages.site.footer[key] })).toHaveAttribute(
        'href',
        `/pages/${path}`,
      );
    }
    expect(screen.getByRole('link', { name: messages.site.header.store })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(screen.getByText(String(new Date().getFullYear()))).toBeInTheDocument();
    expect(screen.getByAltText(messages.site.brand)).toHaveAttribute('src', '/logo-alasma.svg');
    expect(document.querySelector('[data-feature="publish-packages"]')).toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: messages.site.header.categories })).toHaveAttribute(
      'href',
      '/categories',
    );
    for (const feature of ['publish-packages']) {
      const gates = document.querySelectorAll(`[data-feature="${feature}"]`);
      expect(gates.length).toBeGreaterThan(0);
      gates.forEach((gate) => {
        expect(gate).toHaveAttribute('inert');
        expect(gate.querySelector('a')).toBeNull();
        expect(gate).toHaveTextContent(messages.site.soon);
      });
    }
  });

  it('does not render deferred social or contact blocks', () => {
    render(<SiteFooter socialLinks={<div>Social block</div>} />);

    expect(screen.queryByText('Social block')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SiteFooter />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
