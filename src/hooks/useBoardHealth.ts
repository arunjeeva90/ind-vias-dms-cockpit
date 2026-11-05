import { useEffect, useState } from 'react';

export interface BoardHealth {
  version: number | string;
  videoFrameCount: number;
  telemetryFrameCount: number;
}

/** Health is diagnostic only; it never substitutes for fresh telemetry. */
export function parseBoardHealth(value: unknown): BoardHealth | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const version = v.version ?? v.protocolVersion;
  const videoFrameCount = v.videoFrameCount ?? v.videoFrames;
  const telemetryFrameCount = v.telemetryFrameCount ?? v.telemetryFrames;
  if ((typeof version !== 'number' && typeof version !== 'string') ||
      typeof videoFrameCount !== 'number' || !Number.isSafeInteger(videoFrameCount) || videoFrameCount < 0 ||
      typeof telemetryFrameCount !== 'number' || !Number.isSafeInteger(telemetryFrameCount) || telemetryFrameCount < 0) return null;
  return { version, videoFrameCount, telemetryFrameCount };
}

export function useBoardHealth(url: string, enabled: boolean) {
  const [health, setHealth] = useState<BoardHealth | null>(null);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setHealth(null);
    setAvailable(false);
    if (!enabled) return;
    let active = true;
    let inFlight = false;
    let controller: AbortController | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      controller = new AbortController();
      timeout = setTimeout(() => controller?.abort(), 2500);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Health unavailable');
        const result = parseBoardHealth(await response.json());
        if (active) {
          setAvailable(result !== null);
          if (result) setHealth(result);
        }
      } catch {
        if (active) setAvailable(false);
      } finally {
        if (timeout !== null) clearTimeout(timeout);
        timeout = null;
        inFlight = false;
      }
    };
    void poll();
    const timer = setInterval(() => { void poll(); }, 3000);
    return () => { active = false; clearInterval(timer); if (timeout !== null) clearTimeout(timeout); controller?.abort(); };
  }, [url, enabled]);
  return { health, available };
}
