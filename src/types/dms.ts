export enum DriverState {
  ATTENTIVE = 'attentive',
  DROWSY = 'drowsy',
  DISTRACTED = 'distracted',
  FATIGUED = 'fatigued',
  PHONE_USE = 'phone_use',
}

export interface HeadPose {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface GazeData {
  x: number;
  y: number;
  onRoad: boolean;
}

export interface DrowsinessMetrics {
  perclos: number;
  blinkRate: number;
  blinkDuration: number;
  yawnCount: number;
  score: number;
}

export interface DistractionMetrics {
  score: number;
  gazeOffRoad: boolean;
  duration_ms: number;
}

export interface SeatbeltStatus {
  worn: boolean;
  /** Confidence value in range 0-1 (0 = no confidence, 1 = full confidence) */
  confidence: number;
}

export interface PhoneSuspicion {
  detected: boolean;
  confidence: number;
  handPosition: string;
}

export interface DMSConfidence {
  /** Overall confidence value in range 0-1 (0 = no confidence, 1 = full confidence) */
  overall: number;
  faceDetected: boolean;
  eyesVisible: boolean;
  quality: string;
}

export interface ADASFusion {
  ready: boolean;
  laneKeepAssist: boolean;
  collisionWarning: boolean;
  speedAdaptation: boolean;
  integrationScore: number;
}

export interface DMSTelemetry {
  timestamp: number;
  driverState: DriverState;
  headPose: HeadPose;
  gaze: GazeData;
  drowsiness: DrowsinessMetrics;
  distraction: DistractionMetrics;
  seatbelt: SeatbeltStatus;
  phoneSuspicion: PhoneSuspicion;
  confidence: DMSConfidence;
  adasFusion: ADASFusion;
}
