import { useEffect, useRef, useState, useCallback } from 'react';
import { DMSTelemetry } from '../types/dms';
import { DmsTelemetryMessage } from '../types/dmsTelemetryContract';
import {
  DmsTelemetryReceiver,
  ReceiverStatus,
  ReceiverMode,
  createDmsReceiver,
} from '../services/receivers';
import { toDashboardTelemetry } from '../services/adapters/dmsTelemetryAdapter';

export interface UseDmsTelemetryOptions {
  mode?: ReceiverMode;
  wsUrl?: string;
  replayMessages?: DmsTelemetryMessage[];
  replaySpeed?: number;
  replayLoop?: boolean;
}

export interface UseDmsTelemetryResult {
  data: DMSTelemetry | null;
  receiverStatus: ReceiverStatus;
  connected: boolean;
  mode: string;
  error: string | null;
}

const DEFAULT_STATUS: ReceiverStatus = {
  mode: 'DUMMY',
  connected: false,
  lastMessageTimeMs: null,
  messageCount: 0,
  error: null,
  endpoint: null,
};

/**
 * React hook that creates and manages a DMS telemetry receiver.
 * Uses RAF-based updates to keep UI in sync with incoming telemetry data.
 * Falls back to dummy mode if live WebSocket connection fails.
 */
export function useDmsTelemetry(options?: UseDmsTelemetryOptions): UseDmsTelemetryResult {
  const mode = options?.mode ?? 'DUMMY';
  const wsUrl = options?.wsUrl;

  const [data, setData] = useState<DMSTelemetry | null>(null);
  const [connected, setConnected] = useState(false);
  const [receiverStatus, setReceiverStatus] = useState<ReceiverStatus>(DEFAULT_STATUS);
  const [error, setError] = useState<string | null>(null);

  const receiverRef = useRef<DmsTelemetryReceiver | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestDataRef = useRef<DMSTelemetry | null>(null);
  const dirtyRef = useRef(false);
  const fallbackReceiverRef = useRef<DmsTelemetryReceiver | null>(null);

  const updateState = useCallback(() => {
    if (dirtyRef.current && latestDataRef.current) {
      setData(latestDataRef.current);
      dirtyRef.current = false;
    }
    rafRef.current = requestAnimationFrame(updateState);
  }, []);

  useEffect(() => {
    const receiver = createDmsReceiver({
      mode,
      wsUrl,
      replayMessages: options?.replayMessages,
      replaySpeed: options?.replaySpeed,
      replayLoop: options?.replayLoop,
    });

    receiverRef.current = receiver;
    let fallbackUnsubscribe: (() => void) | null = null;
    let messageReceived = false;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = receiver.subscribe((message: DmsTelemetryMessage) => {
      messageReceived = true;
      const telemetry = toDashboardTelemetry(message);
      latestDataRef.current = telemetry;
      dirtyRef.current = true;
    });

    // Start the receiver
    receiver.connect();

    // For LIVE_WS mode, if no message is received within 5 seconds,
    // spin up a DummyDmsReceiver as fallback.
    if (mode === 'LIVE_WS') {
      fallbackTimeout = setTimeout(() => {
        if (!messageReceived) {
          const dummyReceiver = createDmsReceiver({ mode: 'DUMMY' });
          fallbackReceiverRef.current = dummyReceiver;

          fallbackUnsubscribe = dummyReceiver.subscribe((message: DmsTelemetryMessage) => {
            const telemetry = toDashboardTelemetry(message);
            latestDataRef.current = telemetry;
            dirtyRef.current = true;
          });

          dummyReceiver.connect();
        }
      }, 5000);
    }

    // Start RAF loop
    rafRef.current = requestAnimationFrame(updateState);

    // Poll connection status
    const statusInterval = setInterval(() => {
      const activeReceiver = fallbackReceiverRef.current ?? receiverRef.current;
      if (activeReceiver) {
        const status = activeReceiver.getStatus();
        setConnected(status.connected);
        setReceiverStatus(status);
        setError(status.error);
      }
    }, 1000);

    return () => {
      unsubscribe();
      receiver.disconnect();

      if (fallbackUnsubscribe) {
        fallbackUnsubscribe();
      }
      if (fallbackReceiverRef.current) {
        fallbackReceiverRef.current.disconnect();
        fallbackReceiverRef.current = null;
      }

      if (fallbackTimeout !== null) {
        clearTimeout(fallbackTimeout);
      }

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      clearInterval(statusInterval);
      receiverRef.current = null;
    };
  }, [mode, wsUrl, options?.replayMessages, options?.replaySpeed, options?.replayLoop, updateState]);

  return {
    data,
    receiverStatus,
    connected,
    mode,
    error,
  };
}
