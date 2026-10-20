import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROACTIVE_REFRESH_LEAD_MS, REFRESH_RETRY_PAUSE_MS } from '../auth-constants';
import { sessionStore } from '../session/session-store';
import { useProactiveRefresh } from './use-proactive-refresh';

const ensureFreshSession = vi.hoisted(() => vi.fn());

vi.mock('../session/auth-session', () => ({ ensureFreshSession }));

function Probe({ isActive }: Readonly<{ isActive: boolean }>) {
  useProactiveRefresh(isActive);

  return null;
}

const tokenLife = 5 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  ensureFreshSession.mockReset();
  ensureFreshSession.mockImplementation(async () => {
    sessionStore.set('renewed', Date.now() + tokenLife);

    return 'renewed';
  });
  sessionStore.set('first', Date.now() + tokenLife);
});

afterEach(() => {
  sessionStore.clear();
  vi.useRealTimers();
});

describe('useProactiveRefresh', () => {
  it('renews shortly before the token expires and schedules the next renewal', async () => {
    render(<Probe isActive />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(tokenLife - PROACTIVE_REFRESH_LEAD_MS - 1);
    });
    expect(ensureFreshSession).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(ensureFreshSession).toHaveBeenCalledTimes(1);
    expect(ensureFreshSession).toHaveBeenCalledWith({ force: true });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(tokenLife - PROACTIVE_REFRESH_LEAD_MS);
    });
    expect(ensureFreshSession).toHaveBeenCalledTimes(2);
  });

  it('does nothing while inactive and stops when the session ends', async () => {
    const { rerender } = render(<Probe isActive={false} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(tokenLife * 2);
    });
    expect(ensureFreshSession).not.toHaveBeenCalled();

    sessionStore.set('again', Date.now() + tokenLife);
    rerender(<Probe isActive />);
    rerender(<Probe isActive={false} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(tokenLife * 2);
    });
    expect(ensureFreshSession).not.toHaveBeenCalled();
  });

  it('clears its timer on unmount', async () => {
    const { unmount } = render(<Probe isActive />);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(tokenLife * 2);
    });

    expect(ensureFreshSession).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('checks again when the tab becomes visible after a throttled background period', async () => {
    render(<Probe isActive />);
    // time passed while timers were frozen
    vi.setSystemTime(Date.now() + tokenLife - PROACTIVE_REFRESH_LEAD_MS + 1_000);

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(ensureFreshSession).toHaveBeenCalledTimes(1);
  });

  it('waits for the pause after a failed renewal instead of looping', async () => {
    ensureFreshSession.mockRejectedValue(new Error('network'));
    render(<Probe isActive />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(tokenLife - PROACTIVE_REFRESH_LEAD_MS);
    });
    expect(ensureFreshSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REFRESH_RETRY_PAUSE_MS - 1);
    });
    expect(ensureFreshSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(ensureFreshSession).toHaveBeenCalledTimes(2);
  });
});
