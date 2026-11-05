import { DMSTelemetry } from '../types/dms';
import type { TelemetryProvider } from './telemetry';
import { isValidTelemetryPayload } from './validation/validateTelemetry';

export type SocketState = 'Connecting' | 'Live' | 'Disconnected' | 'Reconnecting';

export class WebSocketTelemetryProvider implements TelemetryProvider {
  private ws: WebSocket | null = null;
  private callback: ((data: DMSTelemetry) => void) | null = null;
  private statusCallback: ((state: SocketState) => void) | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor(private url: string) {}

  onStatus(callback: (state: SocketState) => void): void { this.statusCallback = callback; }
  onData(callback: (data: DMSTelemetry) => void): void { this.callback = callback; }
  isConnected(): boolean { return this.connected; }

  connect(): void {
    if (this.shouldReconnect) return;
    this.shouldReconnect = true;
    this.attemptConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.releaseSocket();
    this.statusCallback?.('Disconnected');
  }

  private releaseSocket(): void {
    const socket = this.ws;
    this.ws = null;
    this.connected = false;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
    }
  }

  private attemptConnection(): void {
    if (!this.shouldReconnect) return;
    this.statusCallback?.(this.reconnectAttempts ? 'Reconnecting' : 'Connecting');
    try {
      const socket = new WebSocket(this.url);
      this.ws = socket;
      socket.onopen = () => {
        if (this.ws !== socket || !this.shouldReconnect) return;
        this.connected = true;
        // A TCP/WebSocket connection is not evidence of valid live telemetry.
      };
      socket.onmessage = event => {
        if (this.ws !== socket || !this.shouldReconnect) return;
        let parsed: unknown;
        try { parsed = JSON.parse(event.data as string); } catch { return; }
        if (!isValidTelemetryPayload(parsed)) return;
        this.reconnectAttempts = 0;
        this.callback?.(parsed);
        this.statusCallback?.('Live');
      };
      socket.onclose = () => {
        if (this.ws !== socket) return;
        this.releaseSocket();
        this.statusCallback?.('Disconnected');
        this.scheduleReconnect();
      };
      socket.onerror = () => {
        if (this.ws !== socket) return;
        this.releaseSocket();
        this.statusCallback?.('Disconnected');
        this.scheduleReconnect();
      };
    } catch {
      this.statusCallback?.('Disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer !== null) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts++, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.attemptConnection();
    }, delay);
  }
}
