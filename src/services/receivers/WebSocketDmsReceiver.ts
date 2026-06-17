import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';
import { validateDmsTelemetryMessage } from '../validation/validateDmsTelemetryMessage';
import {
  DmsTelemetryReceiver,
  ReceiverStatus,
  UnsubscribeFn,
} from './DmsTelemetryReceiver';

const DEFAULT_ENDPOINT = 'ws://localhost:8765/dms';
const MAX_RECONNECT_DELAY_MS = 30000;

export interface WebSocketDmsReceiverOptions {
  endpoint?: string;
}

export class WebSocketDmsReceiver implements DmsTelemetryReceiver {
  private ws: WebSocket | null = null;
  private subscribers: Set<(message: DmsTelemetryMessage) => void> = new Set();
  private connected = false;
  private shouldReconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessage: DmsTelemetryMessage | null = null;
  private lastMessageTimeMs: number | null = null;
  private messageCount = 0;
  private error: string | null = null;
  private endpoint: string;

  constructor(options?: WebSocketDmsReceiverOptions) {
    this.endpoint = options?.endpoint ?? DEFAULT_ENDPOINT;
  }

  async connect(): Promise<void> {
    this.shouldReconnect = true;
    this.error = null;
    this.attemptConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.error = null;

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe(callback: (message: DmsTelemetryMessage) => void): UnsubscribeFn {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getStatus(): ReceiverStatus {
    return {
      mode: 'LIVE_WS',
      connected: this.connected,
      lastMessageTimeMs: this.lastMessageTimeMs,
      messageCount: this.messageCount,
      error: this.error,
      endpoint: this.endpoint,
    };
  }

  getLastMessage(): DmsTelemetryMessage | null {
    return this.lastMessage;
  }

  private attemptConnection(): void {
    try {
      this.ws = new WebSocket(this.endpoint);

      this.ws.onopen = () => {
        if (!this.shouldReconnect) {
          this.ws?.close();
          return;
        }
        this.connected = true;
        this.reconnectAttempts = 0;
        this.error = null;
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed: unknown = JSON.parse(event.data as string);
          const result = validateDmsTelemetryMessage(parsed);

          if (!result.valid) {
            console.warn('[DMS WS Receiver] Invalid message:', result.error);
            return;
          }

          const message = parsed as DmsTelemetryMessage;
          this.lastMessage = message;
          this.lastMessageTimeMs = Date.now();
          this.messageCount++;

          for (const subscriber of this.subscribers) {
            subscriber(message);
          }
        } catch {
          console.warn('[DMS WS Receiver] Failed to parse message');
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.error = 'WebSocket connection error';
      };
    } catch {
      this.error = 'Failed to create WebSocket connection';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;

    // Exponential backoff: 1s, 2s, 4s, 8s... up to 30s
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.attemptConnection();
    }, delay);
  }
}
