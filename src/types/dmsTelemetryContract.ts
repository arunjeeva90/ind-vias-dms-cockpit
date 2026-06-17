/**
 * Versioned DMS Telemetry Contract
 *
 * Defines the wire-format for messages received from the DMS telemetry source.
 * This is the canonical contract between the DMS processing pipeline and the cockpit UI.
 */

export const DMS_SCHEMA_VERSION = '1.0.0';

export interface ConnectionStatus {
  latencyMs: number;
  droppedFrames: number;
  uptime: number;
}

export interface DriverStateOutput {
  primary: string;
  secondary: string | null;
  confidence: number;
}

export interface DmsScores {
  drowsiness: number;
  distraction: number;
  fatigue: number;
  alertness: number;
  perclos: number;
  blinkRate: number;
  blinkDurationMs: number;
  yawnCount: number;
  phoneConfidence: number;
}

export interface HeadPoseTelemetry {
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export interface GazeTelemetry {
  x: number;
  y: number;
  onRoad: boolean;
  offRoadDurationMs: number;
}

export interface EyeTelemetry {
  leftOpenness: number;
  rightOpenness: number;
  leftVisible: boolean;
  rightVisible: boolean;
}

export interface BehaviourTelemetry {
  seatbeltWorn: boolean;
  seatbeltConfidence: number;
  phoneDetected: boolean;
  phoneHandPosition: string;
  smokingDetected: boolean;
}

export interface VehicleTelemetry {
  speedKph: number;
  steeringAngleDeg: number;
  brakePressure: number;
  turnSignalActive: boolean;
}

export interface AdasFusionTelemetry {
  ready: boolean;
  laneKeepAssist: boolean;
  collisionWarning: boolean;
  speedAdaptation: boolean;
  integrationScore: number;
}

/**
 * The top-level DMS telemetry message as received over the wire.
 */
export interface DmsTelemetryMessage {
  schemaVersion: string;
  source: string;
  timestampMs: number;
  frameId: number;
  fps: number;
  connection: ConnectionStatus;
  driverState: DriverStateOutput;
  scores: DmsScores;
  headPose: HeadPoseTelemetry;
  gaze: GazeTelemetry;
  eyes: EyeTelemetry;
  behaviour: BehaviourTelemetry;
  vehicle: VehicleTelemetry;
  adasFusion: AdasFusionTelemetry;
}
