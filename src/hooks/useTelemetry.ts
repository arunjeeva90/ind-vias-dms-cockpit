import { useEffect, useState } from 'react';
import { DMSTelemetry } from '../types/dms';
import { createTelemetryProvider, TelemetryMode } from '../services/telemetry';
import { SocketState, WebSocketTelemetryProvider } from '../services/websocketTelemetry';
import { buildVicharakConfig } from '../config/vicharak';

export const TELEMETRY_STALE_MS = 2000;
export function isTelemetryStale(lastReceivedAt: number | null, now = Date.now()): boolean {
  return lastReceivedAt !== null && now - lastReceivedAt >= TELEMETRY_STALE_MS;
}

export function useTelemetry(options?: { mode?: TelemetryMode; url?: string }) {
  const config = buildVicharakConfig();
  const mode = options?.mode ?? config.mode;
  const url = options?.url ?? config.telemetryUrl;
  const [data, setData] = useState<DMSTelemetry | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<SocketState>('Connecting');
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let active = true;
    let lastReceivedAt: number | null = null;
    const provider = createTelemetryProvider(mode, { url });
    setData(null);
    setStale(false);
    setConnected(false);
    setState('Connecting');
    if (provider instanceof WebSocketTelemetryProvider) {
      provider.onStatus(next => {
        if (!active) return;
        setState(next);
        setConnected(provider.isConnected());
      });
    }
    provider.onData(telemetry => {
      if (!active) return;
      lastReceivedAt = Date.now();
      setData(telemetry);
      setStale(false);
      setConnected(provider.isConnected());
    });
    provider.connect();
    const timer = setInterval(() => {
      setStale(mode === 'websocket' && isTelemetryStale(lastReceivedAt));
    }, 100);
    return () => {
      active = false;
      clearInterval(timer);
      provider.disconnect();
    };
  }, [mode, url]);

  return { data, connected, mode, state, stale };
}
