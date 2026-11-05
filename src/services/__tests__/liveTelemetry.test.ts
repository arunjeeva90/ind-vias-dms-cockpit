import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildVicharakConfig } from '../../config/vicharak';
import { isValidTelemetryPayload } from '../validation/validateTelemetry';
import { WebSocketTelemetryProvider } from '../websocketTelemetry';
import { telemetryFixture } from '../../tests/telemetryFixture';
import { MockWebSocket } from '../../tests/MockWebSocket';

describe('board configuration and validation', () => {
  it('builds Ethernet endpoints from environment variables', () => {
    expect(buildVicharakConfig({ VITE_TELEMETRY_MODE: 'websocket', VITE_VICHARAK_HOST: '192.168.10.8', VITE_VICHARAK_PORT: '9000' })).toEqual({
      mode: 'websocket', telemetryUrl: 'ws://192.168.10.8:9000/dms', videoUrl: 'http://192.168.10.8:9000/video.mjpg', healthUrl: 'http://192.168.10.8:9000/health',
    });
    expect(buildVicharakConfig({}).mode).toBe('websocket');
    expect(buildVicharakConfig({ VITE_TELEMETRY_MODE: 'dummy' }).mode).toBe('dummy');
  });
  it('rejects invalid configuration', () => {
    expect(() => buildVicharakConfig({ VITE_VICHARAK_HOST: 'http://bad/path' })).toThrow();
    expect(() => buildVicharakConfig({ VITE_VICHARAK_PORT: '65536' })).toThrow();
    expect(() => buildVicharakConfig({ VITE_TELEMETRY_MODE: 'typo' })).toThrow();
  });
  it('accepts version 1 telemetry without changing percentage units', () => {
    const message = telemetryFixture(); expect(isValidTelemetryPayload(message)).toBe(true); expect(message.drowsiness.perclos).toBe(8.5);
  });
  it.each([null, [], {}, { ...telemetryFixture(), version: 2 }, { ...telemetryFixture(), driverState: 'invalid' },
    { ...telemetryFixture(), headPose: null }, { ...telemetryFixture(), timestamp: NaN },
    { ...telemetryFixture(), gaze: { x: 2, y: 0, onRoad: true } }, { ...telemetryFixture(), drowsiness: { perclos: 5 } },
    { ...telemetryFixture(), frameId: 1.5 }, { ...telemetryFixture(), stream: {} },
    { ...telemetryFixture(), seatbelt: { worn: 'true', confidence: 0.9 } },
  ])('rejects malformed telemetry %#', value => { expect(isValidTelemetryPayload(value)).toBe(false); });
});

describe('WebSocket lifecycle', () => {
  let provider: WebSocketTelemetryProvider;
  beforeEach(() => {
    vi.useFakeTimers(); MockWebSocket.instances = []; vi.stubGlobal('WebSocket', MockWebSocket);
    provider = new WebSocketTelemetryProvider('ws://192.168.50.2:8080/dms');
  });
  afterEach(() => { provider.disconnect(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('only delivers validated messages and recovers after malformed JSON', () => {
    const callback = vi.fn(); provider.onData(callback); provider.connect(); const socket = MockWebSocket.instances[0]; socket.open();
    socket.onmessage?.({ data: '{broken' }); socket.message({}); socket.message(telemetryFixture());
    expect(callback).toHaveBeenCalledTimes(1); expect(callback).toHaveBeenCalledWith(telemetryFixture());
  });
  it('retries with exponential backoff and resets after valid data', () => {
    const status = vi.fn(); provider.onStatus(status); provider.connect(); provider.connect(); expect(MockWebSocket.instances).toHaveLength(1);
    MockWebSocket.instances[0].drop(); expect(status).toHaveBeenLastCalledWith('Disconnected');
    vi.advanceTimersByTime(999); expect(MockWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1); expect(status).toHaveBeenLastCalledWith('Reconnecting');
    MockWebSocket.instances[1].drop(); vi.advanceTimersByTime(1999); expect(MockWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1); const socket = MockWebSocket.instances[2]; socket.open(); socket.message(telemetryFixture());
    expect(status).toHaveBeenLastCalledWith('Live'); expect(provider.isConnected()).toBe(true);
    socket.drop(); vi.advanceTimersByTime(1000); expect(MockWebSocket.instances).toHaveLength(4);
  });
  it('cleans up pending reconnects and ignores retired socket callbacks', () => {
    provider.connect(); const socket = MockWebSocket.instances[0]; const lateOpen = socket.onopen;
    socket.drop(); provider.disconnect(); lateOpen?.(); vi.advanceTimersByTime(60000);
    expect(MockWebSocket.instances).toHaveLength(1); expect(provider.isConnected()).toBe(false);
    expect(socket.onmessage).toBeNull(); expect(socket.closed).toBe(true);
  });
  it('retries errors and cleans up active sockets', () => {
    provider.connect(); MockWebSocket.instances[0].onerror?.(); vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(2); provider.disconnect(); expect(MockWebSocket.instances[1].closed).toBe(true);
  });
});
