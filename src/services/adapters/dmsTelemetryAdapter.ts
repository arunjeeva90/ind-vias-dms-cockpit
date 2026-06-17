import {
  DMSTelemetry,
  DriverState,
  HeadPose,
  GazeData,
  DrowsinessMetrics,
  DistractionMetrics,
  SeatbeltStatus,
  PhoneSuspicion,
  DMSConfidence,
  ADASFusion,
} from '../../types/dms';
import { DmsTelemetryMessage } from '../../types/dmsTelemetryContract';

/**
 * Maps a DmsTelemetryMessage (wire format) to the DMSTelemetry type
 * expected by the dashboard UI components.
 */
export function toDashboardTelemetry(message: DmsTelemetryMessage): DMSTelemetry {
  const driverState = mapDriverState(message);

  const headPose: HeadPose = {
    yaw: message.headPose.yawDeg,
    pitch: message.headPose.pitchDeg,
    roll: message.headPose.rollDeg,
  };

  const gaze: GazeData = {
    x: message.gaze.x,
    y: message.gaze.y,
    onRoad: message.gaze.onRoad,
  };

  const drowsiness: DrowsinessMetrics = {
    perclos: message.eyes.perclos60s * 100,
    blinkRate: message.eyes.blinkRatePerMin,
    blinkDuration: message.eyes.blinkDurationMs,
    yawnCount: 0, // Not directly available in contract
    score: message.scores.drowsiness * 100,
  };

  const distraction: DistractionMetrics = {
    score: message.scores.distraction * 100,
    gazeOffRoad: !message.gaze.onRoad,
    duration_ms: message.gaze.eyesOffRoadMs,
  };

  const seatbelt: SeatbeltStatus = {
    worn: message.behaviour.seatbeltFastened,
    confidence: message.scores.dmsConfidence,
  };

  const phoneSuspicion: PhoneSuspicion = {
    detected: message.behaviour.phoneDetected,
    confidence: message.behaviour.phoneConfidence * 100,
    handPosition: message.behaviour.phoneDetected ? 'detected' : 'none',
  };

  const confidence: DMSConfidence = {
    overall: message.scores.dmsConfidence,
    faceDetected: message.driverState.confidenceState !== 'DEGRADED',
    eyesVisible: message.eyes.leftOpen || message.eyes.rightOpen,
    quality: message.scores.cameraQuality > 0.7
      ? 'good'
      : message.scores.cameraQuality > 0.4
        ? 'fair'
        : 'poor',
  };

  const adasFusion: ADASFusion = {
    ready: message.adasFusion.ready,
    laneKeepAssist: message.adasFusion.ready,
    collisionWarning: true,
    speedAdaptation: message.adasFusion.ready,
    integrationScore: message.adasFusion.integrationScore * 100,
  };

  return {
    timestamp: message.timestampMs,
    driverState,
    headPose,
    gaze,
    drowsiness,
    distraction,
    seatbelt,
    phoneSuspicion,
    confidence,
    adasFusion,
  };
}

/**
 * Maps the new contract driverState.overall to existing DriverState enum.
 * NORMAL -> ATTENTIVE, MONITOR -> DROWSY, WARNING -> DISTRACTED,
 * DANGER -> FATIGUED (or PHONE_USE if phoneDetected), DEGRADED -> ATTENTIVE
 */
function mapDriverState(message: DmsTelemetryMessage): DriverState {
  switch (message.driverState.overall) {
    case 'NORMAL':
      return DriverState.ATTENTIVE;
    case 'MONITOR':
      return DriverState.DROWSY;
    case 'WARNING':
      return DriverState.DISTRACTED;
    case 'DANGER':
      return message.behaviour.phoneDetected
        ? DriverState.PHONE_USE
        : DriverState.FATIGUED;
    case 'DEGRADED':
      return DriverState.ATTENTIVE;
    default:
      return DriverState.ATTENTIVE;
  }
}
