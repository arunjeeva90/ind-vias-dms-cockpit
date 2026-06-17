import {
  DmsTelemetryMessage,
  DMS_SCHEMA_VERSION,
  ConnectionStatus,
  DriverStateOutput,
  DmsScores,
  HeadPoseTelemetry,
  GazeTelemetry,
  EyeTelemetry,
  BehaviourTelemetry,
  VehicleTelemetry,
  AdasFusionTelemetry,
} from '../../types/dmsTelemetryContract';
import {
  DmsTelemetryReceiver,
  ReceiverStatus,
  UnsubscribeFn,
} from './DmsTelemetryReceiver';

type InternalState = 'normal' | 'getting_drowsy' | 'drowsy' | 'recovering' | 'phone_check' | 'distracted';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(current: number, target: number, rate: number): number {
  return current + (target - current) * rate;
}

function smoothNoise(t: number, frequency: number): number {
  return Math.sin(t * frequency) * 0.5 +
    Math.sin(t * frequency * 1.7 + 1.3) * 0.3 +
    Math.sin(t * frequency * 0.5 + 2.7) * 0.2;
}

export class DummyDmsReceiver implements DmsTelemetryReceiver {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private subscribers: Set<(message: DmsTelemetryMessage) => void> = new Set();
  private connected = false;
  private tick = 0;
  private frameId = 0;
  private messageCount = 0;
  private lastMessageTimeMs: number | null = null;

  // Internal simulation state
  private internalState: InternalState = 'normal';
  private stateTimer = 0;
  private stateDuration = 0;

  // Smooth values
  private headYaw = 0;
  private headPitch = 0;
  private headRoll = 0;
  private gazeX = 0.5;
  private gazeY = 0.5;
  private drowsinessScore = 0;
  private distractionScore = 0;
  private attentionScore = 0.9;
  private perclos5s = 0;
  private perclos60s = 0;
  private blinkRate = 15;
  private blinkDuration = 150;
  private phoneConfidence = 0;
  private eyesOffRoadMs = 0;

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    this.tick = 0;
    this.frameId = 0;
    this.transitionState('normal');

    this.intervalId = setInterval(() => {
      this.tick++;
      this.frameId++;
      this.update();
    }, 100); // 10Hz
  }

  disconnect(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe(callback: (message: DmsTelemetryMessage) => void): UnsubscribeFn {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getStatus(): ReceiverStatus {
    return {
      mode: 'DUMMY',
      connected: this.connected,
      lastMessageTimeMs: this.lastMessageTimeMs,
      messageCount: this.messageCount,
      error: null,
      endpoint: null,
    };
  }

  private transitionState(newState: InternalState): void {
    this.internalState = newState;
    this.stateTimer = 0;

    switch (newState) {
      case 'normal':
        this.stateDuration = 80 + Math.random() * 120; // 8-20s at 10Hz
        break;
      case 'getting_drowsy':
        this.stateDuration = 40 + Math.random() * 60; // 4-10s
        break;
      case 'drowsy':
        this.stateDuration = 30 + Math.random() * 50; // 3-8s
        break;
      case 'recovering':
        this.stateDuration = 20 + Math.random() * 30; // 2-5s
        break;
      case 'phone_check':
        this.stateDuration = 20 + Math.random() * 40; // 2-6s
        break;
      case 'distracted':
        this.stateDuration = 15 + Math.random() * 25; // 1.5-4s
        break;
    }
  }

  private update(): void {
    const t = this.tick * 0.1; // time in seconds
    this.stateTimer++;

    if (this.stateTimer >= this.stateDuration) {
      this.advanceState();
    }

    const message = this.generateMessage(t);
    this.lastMessageTimeMs = Date.now();
    this.messageCount++;

    for (const subscriber of this.subscribers) {
      subscriber(message);
    }
  }

  private advanceState(): void {
    const rand = Math.random();
    switch (this.internalState) {
      case 'normal':
        if (rand < 0.4) this.transitionState('getting_drowsy');
        else if (rand < 0.65) this.transitionState('phone_check');
        else if (rand < 0.85) this.transitionState('distracted');
        else this.transitionState('normal');
        break;
      case 'getting_drowsy':
        if (rand < 0.6) this.transitionState('drowsy');
        else this.transitionState('recovering');
        break;
      case 'drowsy':
        this.transitionState('recovering');
        break;
      case 'recovering':
        this.transitionState('normal');
        break;
      case 'phone_check':
        this.transitionState('normal');
        break;
      case 'distracted':
        this.transitionState('normal');
        break;
    }
  }

  private generateMessage(t: number): DmsTelemetryMessage {
    const lerpRate = 0.08;

    // Target values based on state
    let targetDrowsiness = 0;
    let targetDistraction = 0;
    let targetAttention = 0.9;
    let targetPerclos5s = 0;
    let targetPerclos60s = 0;
    let targetBlinkRate = 15;
    let targetBlinkDuration = 150;
    let targetPhoneConf = 0;
    let targetGazeX = 0.5;
    let targetGazeY = 0.5;
    let gazeOnRoad = true;
    let targetYaw = 0;
    let targetPitch = 0;
    let yawnDetected = false;
    let headDownDetected = false;

    switch (this.internalState) {
      case 'normal':
        targetDrowsiness = 0.05 + Math.random() * 0.1;
        targetDistraction = 0.05 + Math.random() * 0.08;
        targetAttention = 0.85 + Math.random() * 0.1;
        targetPerclos5s = 0.03 + Math.random() * 0.04;
        targetPerclos60s = 0.05 + Math.random() * 0.05;
        targetBlinkRate = 14 + Math.random() * 4;
        targetBlinkDuration = 120 + Math.random() * 60;
        targetGazeX = 0.45 + smoothNoise(t, 0.3) * 0.1;
        targetGazeY = 0.45 + smoothNoise(t, 0.25) * 0.08;
        gazeOnRoad = true;
        targetYaw = smoothNoise(t, 0.2) * 10;
        targetPitch = smoothNoise(t, 0.15) * 5;
        break;

      case 'getting_drowsy':
        targetDrowsiness = 0.35 + Math.random() * 0.2;
        targetDistraction = 0.15 + Math.random() * 0.1;
        targetAttention = 0.5 + Math.random() * 0.15;
        targetPerclos5s = 0.15 + Math.random() * 0.1;
        targetPerclos60s = 0.2 + Math.random() * 0.15;
        targetBlinkRate = 10 + Math.random() * 4;
        targetBlinkDuration = 250 + Math.random() * 100;
        targetGazeX = 0.45 + smoothNoise(t, 0.2) * 0.08;
        targetGazeY = 0.55 + smoothNoise(t, 0.15) * 0.1;
        gazeOnRoad = true;
        targetYaw = smoothNoise(t, 0.1) * 8;
        targetPitch = 5 + smoothNoise(t, 0.12) * 8;
        yawnDetected = Math.random() < 0.03;
        break;

      case 'drowsy':
        targetDrowsiness = 0.7 + Math.random() * 0.2;
        targetDistraction = 0.25 + Math.random() * 0.15;
        targetAttention = 0.2 + Math.random() * 0.15;
        targetPerclos5s = 0.35 + Math.random() * 0.2;
        targetPerclos60s = 0.4 + Math.random() * 0.25;
        targetBlinkRate = 6 + Math.random() * 4;
        targetBlinkDuration = 400 + Math.random() * 200;
        targetGazeX = 0.4 + smoothNoise(t, 0.15) * 0.12;
        targetGazeY = 0.6 + smoothNoise(t, 0.1) * 0.12;
        gazeOnRoad = Math.random() > 0.3;
        targetYaw = smoothNoise(t, 0.08) * 15;
        targetPitch = 10 + smoothNoise(t, 0.1) * 12;
        yawnDetected = Math.random() < 0.05;
        headDownDetected = Math.random() < 0.1;
        break;

      case 'recovering':
        targetDrowsiness = 0.2 + Math.random() * 0.15;
        targetDistraction = 0.1 + Math.random() * 0.08;
        targetAttention = 0.7 + Math.random() * 0.1;
        targetPerclos5s = 0.08 + Math.random() * 0.05;
        targetPerclos60s = 0.1 + Math.random() * 0.08;
        targetBlinkRate = 18 + Math.random() * 6;
        targetBlinkDuration = 140 + Math.random() * 40;
        targetGazeX = 0.5 + smoothNoise(t, 0.4) * 0.06;
        targetGazeY = 0.45 + smoothNoise(t, 0.35) * 0.05;
        gazeOnRoad = true;
        targetYaw = smoothNoise(t, 0.3) * 12;
        targetPitch = smoothNoise(t, 0.25) * 6;
        break;

      case 'phone_check':
        targetDrowsiness = 0.05 + Math.random() * 0.08;
        targetDistraction = 0.6 + Math.random() * 0.25;
        targetAttention = 0.25 + Math.random() * 0.15;
        targetPerclos5s = 0.05 + Math.random() * 0.05;
        targetPerclos60s = 0.05 + Math.random() * 0.05;
        targetBlinkRate = 12 + Math.random() * 4;
        targetBlinkDuration = 140 + Math.random() * 40;
        targetPhoneConf = 0.7 + Math.random() * 0.25;
        targetGazeX = 0.2 + smoothNoise(t, 0.5) * 0.1;
        targetGazeY = 0.7 + smoothNoise(t, 0.4) * 0.08;
        gazeOnRoad = false;
        targetYaw = -25 + smoothNoise(t, 0.3) * 8;
        targetPitch = 15 + smoothNoise(t, 0.25) * 5;
        break;

      case 'distracted':
        targetDrowsiness = 0.05 + Math.random() * 0.1;
        targetDistraction = 0.5 + Math.random() * 0.3;
        targetAttention = 0.3 + Math.random() * 0.15;
        targetPerclos5s = 0.05 + Math.random() * 0.05;
        targetPerclos60s = 0.05 + Math.random() * 0.05;
        targetBlinkRate = 14 + Math.random() * 4;
        targetBlinkDuration = 130 + Math.random() * 50;
        targetGazeX = 0.15 + Math.random() * 0.7;
        targetGazeY = 0.2 + Math.random() * 0.6;
        gazeOnRoad = false;
        targetYaw = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20);
        targetPitch = smoothNoise(t, 0.2) * 10;
        break;
    }

    // Smooth lerp all values
    this.drowsinessScore = lerp(this.drowsinessScore, targetDrowsiness, lerpRate);
    this.distractionScore = lerp(this.distractionScore, targetDistraction, lerpRate);
    this.attentionScore = lerp(this.attentionScore, targetAttention, lerpRate);
    this.perclos5s = lerp(this.perclos5s, targetPerclos5s, lerpRate);
    this.perclos60s = lerp(this.perclos60s, targetPerclos60s, lerpRate);
    this.blinkRate = lerp(this.blinkRate, targetBlinkRate, lerpRate);
    this.blinkDuration = lerp(this.blinkDuration, targetBlinkDuration, lerpRate);
    this.phoneConfidence = lerp(this.phoneConfidence, targetPhoneConf, lerpRate);
    this.gazeX = lerp(this.gazeX, clamp(targetGazeX, 0, 1), lerpRate);
    this.gazeY = lerp(this.gazeY, clamp(targetGazeY, 0, 1), lerpRate);
    this.headYaw = lerp(this.headYaw, clamp(targetYaw, -90, 90), lerpRate);
    this.headPitch = lerp(this.headPitch, clamp(targetPitch, -90, 90), lerpRate);
    this.headRoll = lerp(this.headRoll, clamp(smoothNoise(t, 0.18) * 8, -90, 90), lerpRate);

    // Track eyes off road duration
    if (!gazeOnRoad) {
      this.eyesOffRoadMs += 100; // 100ms per tick at 10Hz
    } else {
      this.eyesOffRoadMs = 0;
    }

    const eyesOpen = this.internalState !== 'drowsy' || Math.random() > 0.2;
    const leftOpenness = eyesOpen ? clamp(0.7 + smoothNoise(t, 0.4) * 0.2, 0, 1) : 0.1;
    const rightOpenness = eyesOpen ? clamp(0.7 + smoothNoise(t, 0.35) * 0.2, 0, 1) : 0.1;

    const { overall, drowsinessState, distractionState, recommendedAction } = this.mapDriverStates();
    const cameraQuality = 0.85 + smoothNoise(t, 0.05) * 0.1;
    const dmsConfidence = 0.9 + smoothNoise(t, 0.08) * 0.08;

    const connection: ConnectionStatus = {
      pipelineMode: 'DUMMY',
      cameraHealth: 'OK',
      trackingStatus: 'LOCKED',
    };

    const driverStateOutput: DriverStateOutput = {
      overall,
      drowsinessState,
      distractionState,
      availabilityState: overall === 'DANGER' ? 'UNAVAILABLE' : overall === 'WARNING' ? 'LIMITED' : 'AVAILABLE',
      confidenceState: dmsConfidence > 0.8 ? 'HIGH' : dmsConfidence > 0.6 ? 'MEDIUM' : 'LOW',
      primaryCause: this.getPrimaryCause(),
      secondaryCause: '',
      recommendedAction,
    };

    const scores: DmsScores = {
      attention: Math.round(clamp(this.attentionScore, 0, 1) * 1000) / 1000,
      drowsiness: Math.round(this.drowsinessScore * 1000) / 1000,
      distraction: Math.round(this.distractionScore * 1000) / 1000,
      availability: Math.round(clamp(this.attentionScore * 0.9, 0, 1) * 1000) / 1000,
      dmsConfidence: Math.round(clamp(dmsConfidence, 0, 1) * 1000) / 1000,
      cameraQuality: Math.round(clamp(cameraQuality, 0, 1) * 1000) / 1000,
    };

    const headPose: HeadPoseTelemetry = {
      yawDeg: Math.round(this.headYaw * 10) / 10,
      pitchDeg: Math.round(this.headPitch * 10) / 10,
      rollDeg: Math.round(this.headRoll * 10) / 10,
    };

    const gaze: GazeTelemetry = {
      x: Math.round(this.gazeX * 1000) / 1000,
      y: Math.round(this.gazeY * 1000) / 1000,
      zone: gazeOnRoad ? 'forward' : 'off_road',
      onRoad: gazeOnRoad,
      eyesOffRoadMs: this.eyesOffRoadMs,
      confidence: Math.round(clamp(dmsConfidence, 0, 1) * 1000) / 1000,
    };

    const eyes: EyeTelemetry = {
      leftOpen: eyesOpen,
      rightOpen: eyesOpen,
      leftOpenness: Math.round(leftOpenness * 1000) / 1000,
      rightOpenness: Math.round(rightOpenness * 1000) / 1000,
      blinkRatePerMin: Math.round(this.blinkRate * 10) / 10,
      blinkDurationMs: Math.round(this.blinkDuration),
      perclos5s: Math.round(clamp(this.perclos5s, 0, 1) * 1000) / 1000,
      perclos60s: Math.round(clamp(this.perclos60s, 0, 1) * 1000) / 1000,
    };

    const behaviour: BehaviourTelemetry = {
      seatbeltFastened: true,
      phoneDetected: this.internalState === 'phone_check',
      phoneConfidence: Math.round(this.phoneConfidence * 1000) / 1000,
      smokingDetected: false,
      yawnDetected,
      occlusionDetected: false,
      talkingDetected: false,
      headDownDetected,
    };

    const vehicle: VehicleTelemetry = {
      speedKph: Math.round((80 + smoothNoise(t, 0.05) * 20) * 10) / 10,
      steeringAngleDeg: Math.round(smoothNoise(t, 0.3) * 5 * 10) / 10,
      indicator: 'OFF',
      gear: 'D',
    };

    const adasFusion: AdasFusionTelemetry = {
      ready: this.drowsinessScore < 0.6 && this.distractionScore < 0.7,
      integrationScore: Math.round(
        clamp(0.95 - this.drowsinessScore * 0.3 - this.distractionScore * 0.2, 0, 1) * 1000
      ) / 1000,
      forwardTtcSec: this.distractionScore > 0.5 ? 2.5 : null,
      riskFusionState: this.drowsinessScore > 0.6 ? 'elevated' : 'normal',
    };

    return {
      schemaVersion: DMS_SCHEMA_VERSION,
      source: 'dummy',
      timestampMs: Date.now(),
      frameId: this.frameId,
      fps: 10,
      connection,
      driverState: driverStateOutput,
      scores,
      headPose,
      gaze,
      eyes,
      behaviour,
      vehicle,
      adasFusion,
    };
  }

  private mapDriverStates(): {
    overall: DriverStateOutput['overall'];
    drowsinessState: DriverStateOutput['drowsinessState'];
    distractionState: DriverStateOutput['distractionState'];
    recommendedAction: DriverStateOutput['recommendedAction'];
  } {
    let overall: DriverStateOutput['overall'] = 'NORMAL';
    let drowsinessState: DriverStateOutput['drowsinessState'] = 'NORMAL';
    let distractionState: DriverStateOutput['distractionState'] = 'NORMAL';
    let recommendedAction: DriverStateOutput['recommendedAction'] = 'NO_ACTION';

    // Map drowsiness
    if (this.drowsinessScore > 0.7) {
      drowsinessState = 'DANGER';
    } else if (this.drowsinessScore > 0.5) {
      drowsinessState = 'WARNING';
    } else if (this.drowsinessScore > 0.3) {
      drowsinessState = 'MONITOR';
    }

    // Map distraction
    if (this.distractionScore > 0.7) {
      distractionState = 'DANGER';
    } else if (this.distractionScore > 0.5) {
      distractionState = 'WARNING';
    } else if (this.distractionScore > 0.3) {
      distractionState = 'MONITOR';
    }

    // Overall is the worst of the two
    if (drowsinessState === 'DANGER' || distractionState === 'DANGER') {
      overall = 'DANGER';
      recommendedAction = 'ADAS_ESCALATION';
    } else if (drowsinessState === 'WARNING' || distractionState === 'WARNING') {
      overall = 'WARNING';
      recommendedAction = 'AUDIO_WARNING';
    } else if (drowsinessState === 'MONITOR' || distractionState === 'MONITOR') {
      overall = 'MONITOR';
      recommendedAction = 'SILENT_MONITOR';
    } else {
      overall = 'NORMAL';
      recommendedAction = 'NO_ACTION';
    }

    return { overall, drowsinessState, distractionState, recommendedAction };
  }

  private getPrimaryCause(): string {
    switch (this.internalState) {
      case 'normal':
      case 'recovering':
        return 'none';
      case 'getting_drowsy':
        return 'early_drowsiness';
      case 'drowsy':
        return 'severe_drowsiness';
      case 'phone_check':
        return 'phone_use';
      case 'distracted':
        return 'gaze_off_road';
      default:
        return 'none';
    }
  }
}
