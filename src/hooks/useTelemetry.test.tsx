import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTelemetryStale, useTelemetry } from './useTelemetry';
import { MockWebSocket } from '../tests/MockWebSocket';
import { telemetryFixture } from '../tests/telemetryFixture';

describe('freshness and explicit dummy fallback', () => {
  beforeEach(() => { vi.useFakeTimers(); MockWebSocket.instances = []; vi.stubGlobal('WebSocket', MockWebSocket); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('becomes stale at 2 seconds and only recovers on valid data', () => {
    expect(isTelemetryStale(null, 5000)).toBe(false);
    const { result, unmount } = renderHook(() => useTelemetry({ mode: 'websocket' }));
    act(() => { MockWebSocket.instances[0].open(); MockWebSocket.instances[0].message(telemetryFixture()); });
    act(() => vi.advanceTimersByTime(1999)); expect(result.current.stale).toBe(false);
    act(() => vi.advanceTimersByTime(1)); expect(result.current.stale).toBe(true); expect(result.current.data?.frameId).toBe(12842);
    act(() => MockWebSocket.instances[0].message({})); expect(result.current.stale).toBe(true);
    act(() => MockWebSocket.instances[0].message({ ...telemetryFixture(), frameId: 12843 }));
    expect(result.current.stale).toBe(false); expect(result.current.data?.frameId).toBe(12843);
    unmount(); expect(MockWebSocket.instances[0].closed).toBe(true); expect(vi.getTimerCount()).toBe(0);
  });
  it('does not silently substitute dummy data during an outage', () => {
    const { result } = renderHook(() => useTelemetry({ mode: 'websocket' }));
    act(() => vi.advanceTimersByTime(6000)); expect(result.current.data).toBeNull(); expect(result.current.mode).toBe('websocket');
  });
  it('supports explicit dummy fallback without opening a socket', () => {
    const { result } = renderHook(() => useTelemetry({ mode: 'dummy' }));
    act(() => vi.advanceTimersByTime(3000)); expect(result.current.data).not.toBeNull();
    expect(result.current.mode).toBe('dummy'); expect(result.current.stale).toBe(false); expect(MockWebSocket.instances).toHaveLength(0);
  });
});
