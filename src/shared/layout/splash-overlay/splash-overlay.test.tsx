import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SPLASH_DURATION_MS, SplashOverlay } from './splash-overlay';

const seenKey = 'alasma-splash-seen';

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches, media: query })),
  );
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('SplashOverlay', () => {
  it('renders nothing in the first render, like the server does', () => {
    const { container } = render(<SplashOverlay />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows after mounting, hidden from assistive technology', () => {
    render(<SplashOverlay />);

    advance(0);

    const progress = screen.getByRole('progressbar', { hidden: true });
    expect(progress.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('is removed after the splash duration', () => {
    render(<SplashOverlay />);
    advance(0);

    advance(SPLASH_DURATION_MS - 1);
    expect(screen.queryByRole('progressbar', { hidden: true })).toBeInTheDocument();

    advance(1);
    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
  });

  it('does not show again in the same session', () => {
    const first = render(<SplashOverlay />);
    advance(0);
    expect(globalThis.sessionStorage.getItem(seenKey)).toBe('true');
    first.unmount();

    render(<SplashOverlay />);
    advance(0);

    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
  });

  it('does not show under reduced motion', () => {
    mockReducedMotion(true);
    render(<SplashOverlay />);

    advance(0);

    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
  });

  it('shows when the browser has no matchMedia at all', () => {
    vi.stubGlobal('matchMedia', undefined);
    render(<SplashOverlay />);

    advance(0);

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });
});
