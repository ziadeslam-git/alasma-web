import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SplashOverlay } from './splash-overlay';

describe('SplashOverlay', () => {
  it('renders no server-like initial markup and becomes aria-hidden after mounting', async () => {
    render(<SplashOverlay />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('does not render for reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    render(<SplashOverlay />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
