import { DMSTelemetry } from '../types/dms';
import { TelemetryProvider } from './telemetry';

const REQUIRED_KEYS: ReadonlyArray<keyof DMSTelemetry> = [
  'timestamp',
  'driverState',
  'headPose',
  'gaze',
  'drowsiness',
  'distraction',
  'seatbelt',
  'phoneSuspicion',
  'confidence',
  'adasFusion',
];

function isValidTelemetryPayload(data: unknown): data is DMSTelemetry {
  if (typeof data !== 'object' || data === null) return false;
  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) return false;
  }
  return true;
}

export class WebSocketTelemetryProvider implements TelemetryProvider {
  private ws: WebSocket | null = null;
  private callback: ((data: DMSTelemetry) => void) | null = null;
  private connected = false;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    this.shouldReconnect = true;
    this.attemptConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;

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

  onData(callback: (data: DMSTelemetry) => void): void {
    this.callback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private attemptConnection(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // Guard against race condition: if disconnect() was called while
        // the socket was in CONNECTING state, close immediately.
        if (!this.shouldReconnect) {
          this.ws?.close();
          return;
        }
        this.connected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed: unknown = JSON.parse(event.data as string);
          if (!isValidTelemetryPayload(parsed)) {
            console.warn('[DMS WebSocket] Invalid payload: missing required keys');
            return;
          }
          if (this.callback) {
            this.callback(parsed);
          }
        } catch {
          console.warn('[DMS WebSocket] Failed to parse message:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        console.warn('[DMS WebSocket] Connection error');
        // onclose will be called after onerror
      };
    } catch {
      console.warn('[DMS WebSocket] Failed to create WebSocket');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[DMS WebSocket] Max reconnection attempts reached');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, ... up to 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.attemptConnection();
    }, delay);
  }
}
