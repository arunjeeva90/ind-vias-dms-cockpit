import { useEffect, useRef, useState, useCallback } from 'react';
import { DMSTelemetry } from '../types/dms';
import { TelemetryProvider, createTelemetryProvider } from '../services/telemetry';

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
  const dirtyRef = useRef(false);

  const updateState = useCallback(() => {
    if (dirtyRef.current && latestDataRef.current) {
      setData(latestDataRef.current);
      dirtyRef.current = false;
    }
    rafRef.current = requestAnimationFrame(updateState);
  }, []);

  useEffect(() => {
    const provider = createTelemetryProvider(mode, { url });

    providerRef.current = provider;

    provider.onData((telemetry) => {
      latestDataRef.current = telemetry;
      dirtyRef.current = true;
    });

    provider.connect();

    // Let the status poll be the source of truth for connected state
    // instead of setting connected=true immediately after connect()

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
