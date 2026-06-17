import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';
import {
  DmsTelemetryReceiver,
  ReceiverStatus,
  UnsubscribeFn,
} from './DmsTelemetryReceiver';

export interface ReplayDmsReceiverOptions {
  messages: DmsTelemetryMessage[];
  speed?: number; // Playback speed multiplier (default 1.0)
  loop?: boolean; // Whether to loop at end (default false)
}

export class ReplayDmsReceiver implements DmsTelemetryReceiver {
  private subscribers: Set<(message: DmsTelemetryMessage) => void> = new Set();
  private connected = false;
  private messages: DmsTelemetryMessage[];
  private speed: number;
  private loop: boolean;
  private currentIndex = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private messageCount = 0;
  private lastMessageTimeMs: number | null = null;

  constructor(options: ReplayDmsReceiverOptions) {
    this.messages = options.messages;
    this.speed = options.speed ?? 1.0;
    this.loop = options.loop ?? false;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    if (this.messages.length === 0) return;

    this.connected = true;
    this.currentIndex = 0;
    this.scheduleNext();
  }

  disconnect(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.connected = false;
    this.currentIndex = 0;
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
      mode: 'REPLAY',
      connected: this.connected,
      lastMessageTimeMs: this.lastMessageTimeMs,
      messageCount: this.messageCount,
      error: null,
      endpoint: null,
    };
  }

  private scheduleNext(): void {
    if (!this.connected) return;
    if (this.currentIndex >= this.messages.length) {
      if (this.loop) {
        this.currentIndex = 0;
      } else {
        this.connected = false;
        return;
      }
    }

    const currentMsg = this.messages[this.currentIndex];
    this.emit(currentMsg);
    this.currentIndex++;

    // Calculate delay to next message
    if (this.currentIndex < this.messages.length) {
      const nextMsg = this.messages[this.currentIndex];
      const deltaMs = Math.max(
        10,
        (nextMsg.timestampMs - currentMsg.timestampMs) / this.speed
      );
      this.timerId = setTimeout(() => this.scheduleNext(), deltaMs);
    } else if (this.loop) {
      // Small delay before looping
      this.timerId = setTimeout(() => this.scheduleNext(), 100 / this.speed);
    } else {
      this.connected = false;
    }
  }

  private emit(message: DmsTelemetryMessage): void {
    this.lastMessageTimeMs = Date.now();
    this.messageCount++;

    for (const subscriber of this.subscribers) {
      subscriber(message);
    }
  }
}
