import { TelemetryMode } from '../services/telemetry';

export interface VicharakEnvironment {
  VITE_TELEMETRY_MODE?: string;
  VITE_VICHARAK_HOST?: string;
  VITE_VICHARAK_PORT?: string;
}

export function buildVicharakConfig(env: VicharakEnvironment = import.meta.env) {
  const host = env.VITE_VICHARAK_HOST?.trim() || '192.168.50.2';
  const port = env.VITE_VICHARAK_PORT?.trim() || '8080';
  if (!/^[a-zA-Z0-9.-]+$/.test(host) || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('Invalid Vicharak host or port. Check your .env configuration.');
  }
  const configuredMode = env.VITE_TELEMETRY_MODE?.trim().toLowerCase() || 'websocket';
  if (configuredMode !== 'websocket' && configuredMode !== 'dummy') {
    throw new Error('VITE_TELEMETRY_MODE must be websocket or dummy');
  }
  const mode: TelemetryMode = configuredMode;
  const origin = `http://${host}:${port}`;
  return { mode, telemetryUrl: `ws://${host}:${port}/dms`, videoUrl: `${origin}/video.mjpg`, healthUrl: `${origin}/health` };
}
