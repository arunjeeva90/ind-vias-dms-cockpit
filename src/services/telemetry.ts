import { DMSTelemetry } from '../types/dms';
import { DummyTelemetryProvider } from './dummyTelemetry';
import { WebSocketTelemetryProvider } from './websocketTelemetry';

export interface TelemetryProvider {
  connect(): void;
  disconnect(): void;
  onData(callback: (data: DMSTelemetry) => void): void;
  isConnected(): boolean;
}

export type TelemetryMode = 'dummy' | 'websocket';

export interface TelemetryConfig {
  url?: string;
}

export function createTelemetryProvider(
  mode: TelemetryMode,
  config?: TelemetryConfig
): TelemetryProvider {
  if (mode === 'websocket') {
    return new WebSocketTelemetryProvider(config?.url ?? 'ws://localhost:8080/dms');
  }
  return new DummyTelemetryProvider();
}
