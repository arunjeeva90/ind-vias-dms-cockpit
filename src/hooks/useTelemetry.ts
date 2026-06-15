import { useEffect, useRef, useState, useCallback } from 'react';
import { DMSTelemetry } from '../types/dms';
import { TelemetryProvider } from '../services/telemetry';
import { DummyTelemetryProvider } from '../services/dummyTelemetry';
import { WebSocketTelemetryProvider } from '../services/websocketTelemetry';

export type TelemetryMode = 'dummy' | 'websocket';

interface UseTelemetryOptions {
  mode?: TelemetryMode;
  url?: string;
}

interface UseTelemetryResult {
  data: DMSTelemetry | null;
  connected: boolean;
  mode: string;
}

export function useTelemetry(options?: UseTelemetryOptions): UseTelemetryResult {
  const mode = options?.mode ?? 'dummy';
  const url = options?.url ?? 'ws://localhost:8080/dms';

  const [data, setData] = useState<DMSTelemetry | null>(null);
  const [connected, setConnected] = useState(false);
  const providerRef = useRef<TelemetryProvider | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestDataRef = useRef<DMSTelemetry | null>(null);

  const updateState = useCallback(() => {
    if (latestDataRef.current) {
      setData(latestDataRef.current);
    }
    rafRef.current = requestAnimationFrame(updateState);
  }, []);

  useEffect(() => {
    let provider: TelemetryProvider;

    if (mode === 'websocket') {
      provider = new WebSocketTelemetryProvider(url);
    } else {
      provider = new DummyTelemetryProvider();
    }

    providerRef.current = provider;

    provider.onData((telemetry) => {
      latestDataRef.current = telemetry;
    });

    provider.connect();
    setConnected(true);

    // Start animation frame loop for smooth UI updates
    rafRef.current = requestAnimationFrame(updateState);

    // Poll connection status
    const statusInterval = setInterval(() => {
      if (providerRef.current) {
        setConnected(providerRef.current.isConnected());
      }
    }, 1000);

    return () => {
      provider.disconnect();
      setConnected(false);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      clearInterval(statusInterval);
      providerRef.current = null;
    };
  }, [mode, url, updateState]);

  return { data, connected, mode };
}
