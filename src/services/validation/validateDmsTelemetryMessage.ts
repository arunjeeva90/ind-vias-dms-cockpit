import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const VALID_PIPELINE_MODES = ['DUMMY', 'LIVE', 'REPLAY'];
const VALID_CAMERA_HEALTH = ['OK', 'DEGRADED', 'FAILED'];
const VALID_TRACKING_STATUS = ['LOCKED', 'SEARCHING', 'LOST'];
const VALID_OVERALL_STATES = ['NORMAL', 'MONITOR', 'WARNING', 'DANGER', 'DEGRADED'];
const VALID_DROWSINESS_STATES = ['NORMAL', 'MONITOR', 'WARNING', 'DANGER'];
const VALID_DISTRACTION_STATES = ['NORMAL', 'MONITOR', 'WARNING', 'DANGER'];

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
  if (msg.schemaVersion !== '1.0') {
    return { valid: false, error: 'Missing or invalid schemaVersion (expected "1.0")' };
  }

  if (typeof msg.timestampMs !== 'number' || !isFinite(msg.timestampMs)) {
    return { valid: false, error: 'Missing or invalid timestampMs (expected finite number)' };
  }

  if (typeof msg.frameId !== 'number') {
    return { valid: false, error: 'Missing or invalid frameId (expected number)' };
  }

  if (typeof msg.fps !== 'number') {
    return { valid: false, error: 'Missing or invalid fps (expected number)' };
  }

  if (typeof msg.source !== 'string') {
    return { valid: false, error: 'Missing or invalid source (expected string)' };
  }

  // Validate connection
  if (typeof msg.connection !== 'object' || msg.connection === null) {
    return { valid: false, error: 'Missing or invalid connection (expected object)' };
  }
  const conn = msg.connection as Record<string, unknown>;
  if (!VALID_PIPELINE_MODES.includes(conn.pipelineMode as string)) {
    return { valid: false, error: 'connection.pipelineMode must be DUMMY, LIVE, or REPLAY' };
  }
  if (!VALID_CAMERA_HEALTH.includes(conn.cameraHealth as string)) {
    return { valid: false, error: 'connection.cameraHealth must be OK, DEGRADED, or FAILED' };
  }
  if (!VALID_TRACKING_STATUS.includes(conn.trackingStatus as string)) {
    return { valid: false, error: 'connection.trackingStatus must be LOCKED, SEARCHING, or LOST' };
  }

  // Validate driverState
  if (typeof msg.driverState !== 'object' || msg.driverState === null) {
    return { valid: false, error: 'Missing or invalid driverState (expected object)' };
  }
  const ds = msg.driverState as Record<string, unknown>;
  if (!VALID_OVERALL_STATES.includes(ds.overall as string)) {
    return { valid: false, error: 'driverState.overall must be NORMAL, MONITOR, WARNING, DANGER, or DEGRADED' };
  }
  if (!VALID_DROWSINESS_STATES.includes(ds.drowsinessState as string)) {
    return { valid: false, error: 'driverState.drowsinessState must be NORMAL, MONITOR, WARNING, or DANGER' };
  }
  if (!VALID_DISTRACTION_STATES.includes(ds.distractionState as string)) {
    return { valid: false, error: 'driverState.distractionState must be NORMAL, MONITOR, WARNING, or DANGER' };
  }

  // Validate scores
  if (typeof msg.scores !== 'object' || msg.scores === null) {
    return { valid: false, error: 'Missing or invalid scores (expected object)' };
  }
  const scores = msg.scores as Record<string, unknown>;
  if (typeof scores.attention !== 'number') {
    return { valid: false, error: 'scores.attention must be a number' };
  }
  if (typeof scores.drowsiness !== 'number') {
    return { valid: false, error: 'scores.drowsiness must be a number' };
  }
  if (typeof scores.distraction !== 'number') {
    return { valid: false, error: 'scores.distraction must be a number' };
  }
  if (typeof scores.dmsConfidence !== 'number') {
    return { valid: false, error: 'scores.dmsConfidence must be a number' };
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
  if (typeof gaze.zone !== 'string') {
    return { valid: false, error: 'gaze.zone must be a string' };
  }

  // Validate eyes
  if (typeof msg.eyes !== 'object' || msg.eyes === null) {
    return { valid: false, error: 'Missing or invalid eyes (expected object)' };
  }
  const eyes = msg.eyes as Record<string, unknown>;
  if (typeof eyes.leftOpen !== 'boolean' || typeof eyes.rightOpen !== 'boolean') {
    return { valid: false, error: 'eyes.leftOpen and eyes.rightOpen must be booleans' };
  }

  // Validate behaviour
  if (typeof msg.behaviour !== 'object' || msg.behaviour === null) {
    return { valid: false, error: 'Missing or invalid behaviour (expected object)' };
  }
  const behaviour = msg.behaviour as Record<string, unknown>;
  if (typeof behaviour.seatbeltFastened !== 'boolean') {
    return { valid: false, error: 'behaviour.seatbeltFastened must be a boolean' };
  }

  // Validate vehicle
  if (typeof msg.vehicle !== 'object' || msg.vehicle === null) {
    return { valid: false, error: 'Missing or invalid vehicle (expected object)' };
  }

  // Validate adasFusion
  if (typeof msg.adasFusion !== 'object' || msg.adasFusion === null) {
    return { valid: false, error: 'Missing or invalid adasFusion (expected object)' };
  }
  const adas = msg.adasFusion as Record<string, unknown>;
  if (typeof adas.ready !== 'boolean') {
    return { valid: false, error: 'adasFusion.ready must be a boolean' };
  }
  if (typeof adas.integrationScore !== 'number') {
    return { valid: false, error: 'adasFusion.integrationScore must be a number' };
  }

  // If we passed all checks, cast to the expected type to confirm structure
  void (data as DmsTelemetryMessage);

  return { valid: true };
}
