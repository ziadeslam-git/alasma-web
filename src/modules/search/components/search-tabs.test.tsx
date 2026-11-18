import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import * as featureConfig from '@/shared/config/features';
import { axe } from '@/test/axe';

import { SearchTabs } from './search-tabs';

describe('SearchTabs', () => {
  afterEach(() => vi.restoreAllMocks());

  // Task 76: with the authors and events tabs not live, a single "books" tab is noise: nothing is rendered
  it('renders nothing while the authors and events tabs are not live', () => {
    const { container } = render(<SearchTabs />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(messages.search.authors)).toBeNull();
    expect(screen.queryByText(messages.search.events)).toBeNull();
  });

  it('shows the tabs, books current, once a tab feature is live', async () => {
    vi.spyOn(featureConfig, 'getFeatureState').mockImplementation((key) =>
      key === 'search-tab-authors' ? 'live' : 'soon',
    );
    const { container } = render(<SearchTabs />);
    expect(screen.getByText(messages.search.books)).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText(messages.search.authors)).toBeInTheDocument();
    expect(screen.queryByText(messages.search.events)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
