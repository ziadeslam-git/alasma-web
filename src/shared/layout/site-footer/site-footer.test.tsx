import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';
import messages from '@/i18n/messages/ar.json';

import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';

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
    const year = String(new Date().getFullYear());
    expect(screen.getByText(`${messages.site.footer.copyright} ${year}`)).toBeInTheDocument();
    expect(screen.getByText(messages.site.footer.paymentMethodsLine)).toBeInTheDocument();
    expect(screen.getByAltText(messages.site.brand)).toHaveAttribute('src', '/logo-alasma.svg');
    expect(
      screen.getByRole('link', { name: messages.site.header.publishPackages }),
    ).toHaveAttribute('href', '/publish');
    expect(screen.getByRole('link', { name: messages.site.header.categories })).toHaveAttribute(
      'href',
      '/categories',
    );
  });

  it('does not render deferred social or contact blocks', () => {
    render(<SiteFooter socialLinks={<div>Social block</div>} />);

    expect(screen.queryByText('Social block')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SiteFooter />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the newsletter form passed by the layout once the feature is live (Task 93)', () => {
    render(<SiteFooter newsletter={<button type="button">form</button>} />);

    expect(screen.getByRole('button', { name: 'form' })).toBeInTheDocument();
    expect(document.querySelector('[data-feature="home-newsletter"]')).toBeNull();
  });

  it('keeps the newsletter column dimmed and inert while the feature is soon', () => {
    const { container } = render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'home-newsletter': 'soon' }}>
        <SiteFooter newsletter={<button type="button">form</button>} />
      </FeatureFlagsProvider>,
    );

    const gate = container.querySelector('[data-feature="home-newsletter"]');
    expect(gate).toHaveAttribute('inert');
    expect(gate).toHaveTextContent(messages.site.soon);
  });
});
