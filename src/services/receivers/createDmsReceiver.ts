import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';
import { DmsTelemetryReceiver, ReceiverMode } from './DmsTelemetryReceiver';
import { DummyDmsReceiver } from './DummyDmsReceiver';
import { WebSocketDmsReceiver } from './WebSocketDmsReceiver';
import { ReplayDmsReceiver } from './ReplayDmsReceiver';

const DEFAULT_WS_URL = 'ws://localhost:8765/dms';

function getEnvWsUrl(): string | undefined {
  return import.meta.env.VITE_DMS_WS_URL as string | undefined;
}

export interface CreateDmsReceiverOptions {
  mode?: ReceiverMode;
  wsUrl?: string;
  replayMessages?: DmsTelemetryMessage[];
  replaySpeed?: number;
  replayLoop?: boolean;
}

/**
 * Factory function to create the appropriate DMS telemetry receiver.
 *
 * Modes:
 * - DUMMY: Uses the 6-state simulation machine (default)
 * - LIVE_WS: WebSocket connection to a live DMS source
 * - REPLAY: Replays a recorded set of messages
 *
 * When LIVE_WS is configured, falls back to DUMMY if WebSocket fails to connect.
 */
export function createDmsReceiver(options?: CreateDmsReceiverOptions): DmsTelemetryReceiver {
  const mode = options?.mode ?? 'DUMMY';
  const wsUrl = options?.wsUrl ?? getEnvWsUrl() ?? DEFAULT_WS_URL;

  switch (mode) {
    case 'LIVE_WS':
      return new WebSocketDmsReceiver({ endpoint: wsUrl });

    case 'REPLAY':
      return new ReplayDmsReceiver({
        messages: options?.replayMessages ?? [],
        speed: options?.replaySpeed,
        loop: options?.replayLoop,
      });

    case 'DUMMY':
    default:
      return new DummyDmsReceiver();
  }
}
