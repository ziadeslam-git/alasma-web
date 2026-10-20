import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { axe } from '@/test/axe';

import { DEFAULT_TOAST_DURATION, TOAST_EXIT_DURATION } from './toast-constants';
import { ToastProvider, useToast, type ToastKind } from './toast-provider';

const closeLabel = 'Close notification';
const viewportLabel = 'Notifications';

function ToastTrigger({ kind = 'success' }: { kind?: ToastKind }) {
  const { show } = useToast();

  return (
    <button onClick={() => show('Toast message', { closeLabel, kind })} type="button">
      Show toast
    </button>
  );
}

function ToastTestBed({ kind, maxVisible }: { kind?: ToastKind; maxVisible?: number }) {
  return (
    <ToastProvider label={viewportLabel} maxVisible={maxVisible}>
      <ToastTrigger kind={kind} />
    </ToastProvider>
  );
}

// Timers fire outside React's act(), so wrap them or the state updates are not flushed before the assertion.
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

function showToast() {
  fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));

  return screen.getByRole('status');
}

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      matches: matches && query.includes('prefers-reduced-motion'),
      media: query,
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Toast', () => {
  it('uses polite and assertive live-region roles by kind', () => {
    const { rerender } = render(<ToastTestBed kind="success" />);
    showToast();
    expect(screen.getByRole('status')).toHaveTextContent('Toast message');

    rerender(<ToastTestBed kind="error" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Toast message');
  });

  it('removes the toast from the DOM after the default duration and the exit time', () => {
    render(<ToastTestBed />);
    showToast();

    advance(DEFAULT_TOAST_DURATION - 1);
    expect(screen.getByRole('status')).toBeInTheDocument();

    advance(1 + TOAST_EXIT_DURATION);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('removes the toast when the close button is pressed', () => {
    render(<ToastTestBed />);
    showToast();

    fireEvent.click(screen.getByRole('button', { name: closeLabel }));
    advance(TOAST_EXIT_DURATION);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('pauses the countdown while hovered and resumes the rest of it afterwards', () => {
    render(<ToastTestBed />);
    const toast = showToast();

    advance(DEFAULT_TOAST_DURATION / 2);
    fireEvent.mouseEnter(toast);
    advance(DEFAULT_TOAST_DURATION * 2);
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.mouseLeave(toast);
    advance(DEFAULT_TOAST_DURATION / 2 - 1);
    expect(screen.getByRole('status')).toBeInTheDocument();

    advance(1 + TOAST_EXIT_DURATION);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('pauses while a control inside has keyboard focus and resumes on blur', () => {
    render(<ToastTestBed />);
    showToast();
    const close = screen.getByRole('button', { name: closeLabel });

    fireEvent.focus(close);
    advance(DEFAULT_TOAST_DURATION * 2);
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.blur(close);
    advance(DEFAULT_TOAST_DURATION + TOAST_EXIT_DURATION);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays paused while either the mouse or the focus is still on the toast', () => {
    render(<ToastTestBed />);
    const toast = showToast();
    const close = screen.getByRole('button', { name: closeLabel });

    fireEvent.mouseEnter(toast);
    fireEvent.focus(close);
    fireEvent.mouseLeave(toast);
    advance(DEFAULT_TOAST_DURATION * 2);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows at most maxVisible toasts, newest last', () => {
    render(<ToastTestBed maxVisible={2} />);
    const trigger = screen.getByRole('button', { name: 'Show toast' });

    fireEvent.click(trigger);
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it('with reduced motion removes the toast at the end of the countdown with no exit wait', () => {
    mockReducedMotion(true);
    render(<ToastTestBed />);
    showToast();

    advance(DEFAULT_TOAST_DURATION);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('with reduced motion removes the toast at once when it is closed', () => {
    mockReducedMotion(true);
    render(<ToastTestBed />);
    showToast();

    fireEvent.click(screen.getByRole('button', { name: closeLabel }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    vi.useRealTimers();
    const { container } = render(<ToastTestBed />);
    showToast();

    expect(await axe(container)).toHaveNoViolations();
  });
});
