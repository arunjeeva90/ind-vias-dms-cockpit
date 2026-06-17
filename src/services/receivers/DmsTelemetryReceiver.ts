import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';

export type ReceiverMode = 'DUMMY' | 'LIVE_WS' | 'REPLAY';

export interface ReceiverStatus {
  mode: ReceiverMode;
  connected: boolean;
  lastMessageTimeMs: number | null;
  messageCount: number;
  error: string | null;
  endpoint: string | null;
}

export type UnsubscribeFn = () => void;

export interface DmsTelemetryReceiver {
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  subscribe(callback: (message: DmsTelemetryMessage) => void): UnsubscribeFn;
  getStatus(): ReceiverStatus;
}
