import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';
import messages from '@/i18n/messages/ar.json';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders the static-page and catalog links with server-computed copyright year', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('link', { name: messages.site.footer.about })).toHaveAttribute(
      'href',
      '/pages/about',
    );
    expect(screen.getByRole('link', { name: messages.site.header.store })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(screen.getByText(String(new Date().getFullYear()))).toBeInTheDocument();
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
