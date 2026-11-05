import { DMSTelemetry, DriverState } from '../../types/dms';

type RecordValue = Record<string, unknown>;
const object = (v: unknown): v is RecordValue => typeof v === 'object' && v !== null && !Array.isArray(v);
const number = (v: unknown, min = 0, max = Infinity): boolean => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const boolean = (v: unknown): boolean => typeof v === 'boolean';
const fields = (v: unknown, checks: Record<string, (v: unknown) => boolean>): boolean =>
  object(v) && Object.entries(checks).every(([key, check]) => check(v[key]));
const percent = (v: unknown) => number(v, 0, 100);
const confidence = (v: unknown) => number(v, 0, 1);
const integer = (v: unknown) => number(v) && Number.isSafeInteger(v);
const string = (v: unknown) => typeof v === 'string' && v.length > 0;

export type BoardTelemetry = DMSTelemetry & {
  version: 1;
  frameId: number;
  vehicle: { speedKph: number | null };
  stream: { videoUrl: string; healthUrl: string };
};

/** Validate every field read by the cockpit, including numeric units and ranges. */
export function isValidTelemetryPayload(v: unknown): v is BoardTelemetry {
  if (!object(v)) return false;
  return v.version === 1 && integer(v.timestamp) && integer(v.frameId) &&
    Object.values(DriverState).includes(v.driverState as DriverState) &&
    fields(v.headPose, { yaw: x => number(x, -180, 180), pitch: x => number(x, -180, 180), roll: x => number(x, -180, 180) }) &&
    fields(v.gaze, { x: confidence, y: confidence, onRoad: boolean }) &&
    fields(v.drowsiness, { perclos: percent, blinkRate: number, blinkDuration: number, yawnCount: integer, score: percent }) &&
    fields(v.distraction, { score: percent, gazeOffRoad: boolean, duration_ms: number }) &&
    fields(v.seatbelt, { worn: boolean, confidence }) &&
    fields(v.phoneSuspicion, { detected: boolean, confidence: percent, handPosition: string }) &&
    fields(v.confidence, { overall: confidence, faceDetected: boolean, eyesVisible: boolean, quality: string }) &&
    fields(v.adasFusion, { ready: boolean, laneKeepAssist: boolean, collisionWarning: boolean, speedAdaptation: boolean, integrationScore: percent }) &&
    fields(v.vehicle, { speedKph: x => x === null || number(x) }) &&
    fields(v.stream, { videoUrl: string, healthUrl: string });
}
