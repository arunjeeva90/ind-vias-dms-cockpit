import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Runtime validation for DmsTelemetryMessage.
 * Pure TypeScript checks - no external dependencies.
 */
export function validateDmsTelemetryMessage(data: unknown): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Message must be a non-null object' };
  }

  const msg = data as Record<string, unknown>;

  // Check required top-level fields
  if (typeof msg.schemaVersion !== 'string') {
    return { valid: false, error: 'Missing or invalid schemaVersion (expected string)' };
  }

  if (typeof msg.timestampMs !== 'number' || !isFinite(msg.timestampMs)) {
    return { valid: false, error: 'Missing or invalid timestampMs (expected finite number)' };
  }

  // Validate driverState
  if (typeof msg.driverState !== 'object' || msg.driverState === null) {
    return { valid: false, error: 'Missing or invalid driverState (expected object)' };
  }
  const ds = msg.driverState as Record<string, unknown>;
  if (typeof ds.primary !== 'string') {
    return { valid: false, error: 'Missing or invalid driverState.primary (expected string)' };
  }
  if (typeof ds.confidence !== 'number') {
    return { valid: false, error: 'Missing or invalid driverState.confidence (expected number)' };
  }

  // Validate headPose
  if (typeof msg.headPose !== 'object' || msg.headPose === null) {
    return { valid: false, error: 'Missing or invalid headPose (expected object)' };
  }
  const hp = msg.headPose as Record<string, unknown>;
  if (typeof hp.yawDeg !== 'number' || typeof hp.pitchDeg !== 'number' || typeof hp.rollDeg !== 'number') {
    return { valid: false, error: 'headPose must contain numeric yawDeg, pitchDeg, rollDeg' };
  }

  // Validate gaze
  if (typeof msg.gaze !== 'object' || msg.gaze === null) {
    return { valid: false, error: 'Missing or invalid gaze (expected object)' };
  }
  const gaze = msg.gaze as Record<string, unknown>;
  if (typeof gaze.x !== 'number' || typeof gaze.y !== 'number') {
    return { valid: false, error: 'gaze must contain numeric x and y' };
  }
  if (typeof gaze.onRoad !== 'boolean') {
    return { valid: false, error: 'gaze.onRoad must be boolean' };
  }

  // Validate scores
  if (typeof msg.scores !== 'object' || msg.scores === null) {
    return { valid: false, error: 'Missing or invalid scores (expected object)' };
  }
  const scores = msg.scores as Record<string, unknown>;
  if (typeof scores.drowsiness !== 'number' || typeof scores.distraction !== 'number') {
    return { valid: false, error: 'scores must contain numeric drowsiness and distraction' };
  }

  // If we passed all checks, cast to the expected type to confirm structure
  void (data as DmsTelemetryMessage);

  return { valid: true };
}
