import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { parseBoardHealth, useBoardHealth } from './useBoardHealth';
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it('polls health immediately and every 3 seconds, retaining labeled diagnostics after failure', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: 1, videoFrameCount: 42, telemetryFrameCount: 84 }) });
  vi.stubGlobal('fetch', fetcher);
  const { result, unmount } = renderHook(() => useBoardHealth('http://192.168.50.2:8080/health', true));
  await act(async () => { await Promise.resolve(); });
  expect(result.current.health?.videoFrameCount).toBe(42); expect(result.current.available).toBe(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); }); expect(fetcher).toHaveBeenCalledTimes(2);
  fetcher.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(result.current.available).toBe(false); expect(result.current.health?.telemetryFrameCount).toBe(84);
  unmount(); expect(vi.getTimerCount()).toBe(0);
});
it('does not poll in dummy mode and rejects malformed health data', () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  renderHook(() => useBoardHealth('http://192.168.50.2:8080/health', false)); expect(fetcher).not.toHaveBeenCalled();
  expect(parseBoardHealth({ version: 1, videoFrameCount: -1, telemetryFrameCount: 0 })).toBeNull();
  expect(parseBoardHealth(null)).toBeNull();
});
it('aborts an in-flight request and clears polling and timeout on unmount', () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => { signal = options.signal as AbortSignal; return new Promise(() => {}); }));
  const { unmount } = renderHook(() => useBoardHealth('http://192.168.50.2:8080/health', true));
  unmount(); expect(signal?.aborted).toBe(true); expect(vi.getTimerCount()).toBe(0);
});
