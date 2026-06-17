/**
 * Versioned DMS Telemetry Contract
 *
 * Defines the wire-format for messages received from the DMS telemetry source.
 * This is the canonical contract between the DMS processing pipeline and the cockpit UI.
 *
 * All score values use 0.0 to 1.0 range unless explicitly named as ms, deg, sec, or kph.
 */

export const DMS_SCHEMA_VERSION = '1.0';

export interface ConnectionStatus {
  pipelineMode: 'DUMMY' | 'LIVE' | 'REPLAY';
  cameraHealth: 'OK' | 'DEGRADED' | 'FAILED';
  trackingStatus: 'LOCKED' | 'SEARCHING' | 'LOST';
}

export interface DriverStateOutput {
  overall: 'NORMAL' | 'MONITOR' | 'WARNING' | 'DANGER' | 'DEGRADED';
  drowsinessState: 'NORMAL' | 'MONITOR' | 'WARNING' | 'DANGER';
  distractionState: 'NORMAL' | 'MONITOR' | 'WARNING' | 'DANGER';
  availabilityState: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  confidenceState: 'HIGH' | 'MEDIUM' | 'LOW' | 'DEGRADED';
  primaryCause: string;
  secondaryCause: string;
  recommendedAction:
    | 'NO_ACTION'
    | 'SILENT_MONITOR'
    | 'VISUAL_WARNING'
    | 'AUDIO_WARNING'
    | 'HAPTIC_WARNING'
    | 'ADAS_ESCALATION';
}

export interface DmsScores {
  attention: number;
  drowsiness: number;
  distraction: number;
  availability: number;
  dmsConfidence: number;
  cameraQuality: number;
}

export interface HeadPoseTelemetry {
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export interface GazeTelemetry {
  x: number;
  y: number;
  zone: string;
  onRoad: boolean;
  eyesOffRoadMs: number;
  confidence: number;
}

export interface EyeTelemetry {
  leftOpen: boolean;
  rightOpen: boolean;
  leftOpenness: number;
  rightOpenness: number;
  blinkRatePerMin: number;
  blinkDurationMs: number;
  perclos5s: number;
  perclos60s: number;
}

export interface BehaviourTelemetry {
  seatbeltFastened: boolean;
  phoneDetected: boolean;
  phoneConfidence: number;
  smokingDetected: boolean;
  yawnDetected: boolean;
  occlusionDetected: boolean;
  talkingDetected: boolean;
  headDownDetected: boolean;
}

export interface VehicleTelemetry {
  speedKph: number | null;
  steeringAngleDeg: number | null;
  indicator: 'OFF' | 'LEFT' | 'RIGHT' | 'HAZARD' | null;
  gear: string | null;
}

export interface AdasFusionTelemetry {
  ready: boolean;
  integrationScore: number;
  forwardTtcSec: number | null;
  riskFusionState: string;
}

/**
 * The top-level DMS telemetry message as received over the wire.
 */
export interface DmsTelemetryMessage {
  schemaVersion: '1.0';
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
