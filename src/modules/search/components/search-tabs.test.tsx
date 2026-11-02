import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { axe } from '@/test/axe';

import { SearchTabs } from './search-tabs';

describe('SearchTabs', () => {
  it('keeps the books tab current and deferred tabs inert', async () => {
    const { container } = render(<SearchTabs />);
    expect(screen.getByText(messages.search.books)).toHaveAttribute('aria-current', 'page');
    for (const key of ['search-tab-authors', 'search-tab-events']) {
      expect(container.querySelector(`[data-feature="${key}"]`)).toHaveAttribute('inert');
    }
    expect(await axe(container)).toHaveNoViolations();
  });
});
