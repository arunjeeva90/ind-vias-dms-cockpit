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
  const driverState = mapDriverState(message.driverState.primary);

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
    perclos: message.scores.perclos * 100, // Convert 0-1 to 0-100 for UI
    blinkRate: message.scores.blinkRate,
    blinkDuration: message.scores.blinkDurationMs,
    yawnCount: message.scores.yawnCount,
    score: message.scores.drowsiness * 100, // Convert 0-1 to 0-100 for UI
  };

  const distraction: DistractionMetrics = {
    score: message.scores.distraction * 100, // Convert 0-1 to 0-100 for UI
    gazeOffRoad: !message.gaze.onRoad,
    duration_ms: message.gaze.offRoadDurationMs,
  };

  const seatbelt: SeatbeltStatus = {
    worn: message.behaviour.seatbeltWorn,
    confidence: message.behaviour.seatbeltConfidence,
  };

  const phoneSuspicion: PhoneSuspicion = {
    detected: message.behaviour.phoneDetected,
    confidence: message.scores.phoneConfidence * 100, // Convert 0-1 to 0-100
    handPosition: message.behaviour.phoneHandPosition,
  };

  const confidence: DMSConfidence = {
    overall: message.driverState.confidence,
    faceDetected: true, // Derived: if we have a driverState, face is detected
    eyesVisible: message.eyes.leftVisible || message.eyes.rightVisible,
    quality: getQualityLabel(message.driverState.confidence),
  };

  const adasFusion: ADASFusion = {
    ready: message.adasFusion.ready,
    laneKeepAssist: message.adasFusion.laneKeepAssist,
    collisionWarning: message.adasFusion.collisionWarning,
    speedAdaptation: message.adasFusion.speedAdaptation,
    integrationScore: message.adasFusion.integrationScore * 100, // Convert 0-1 to 0-100
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

function mapDriverState(primary: string): DriverState {
  switch (primary) {
    case 'attentive':
      return DriverState.ATTENTIVE;
    case 'drowsy':
      return DriverState.DROWSY;
    case 'fatigued':
      return DriverState.FATIGUED;
    case 'distracted':
      return DriverState.DISTRACTED;
    case 'phone_use':
      return DriverState.PHONE_USE;
    default:
      return DriverState.ATTENTIVE;
  }
}

function getQualityLabel(confidence: number): string {
  if (confidence > 0.8) return 'good';
  if (confidence > 0.5) return 'fair';
  return 'poor';
}
