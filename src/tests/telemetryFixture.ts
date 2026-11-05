import { DriverState } from '../types/dms';
import { BoardTelemetry } from '../services/validation/validateTelemetry';
export function telemetryFixture(): BoardTelemetry {
  return {
    version: 1, timestamp: 1793880000000, frameId: 12842, driverState: DriverState.ATTENTIVE,
    headPose: { yaw: 2.4, pitch: -1.2, roll: 0.8 }, gaze: { x: 0.51, y: 0.46, onRoad: true },
    drowsiness: { perclos: 8.5, blinkRate: 14.2, blinkDuration: 165, yawnCount: 0, score: 7.3 },
    distraction: { score: 5, gazeOffRoad: false, duration_ms: 0 }, seatbelt: { worn: true, confidence: 0.96 },
    phoneSuspicion: { detected: false, confidence: 2.1, handPosition: 'unknown' },
    confidence: { overall: 0.94, faceDetected: true, eyesVisible: true, quality: 'good' },
    adasFusion: { ready: true, laneKeepAssist: true, collisionWarning: true, speedAdaptation: true, integrationScore: 94 },
    vehicle: { speedKph: 25 }, stream: { videoUrl: '/video.mjpg', healthUrl: '/health' },
  };
}
