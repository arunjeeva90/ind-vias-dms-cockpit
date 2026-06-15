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
} from '../types/dms';
import { TelemetryProvider } from './telemetry';

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

type InternalState = 'normal' | 'getting_drowsy' | 'drowsy' | 'recovering' | 'phone_check' | 'distracted';

export class DummyTelemetryProvider implements TelemetryProvider {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: ((data: DMSTelemetry) => void) | null = null;
  private connected = false;
  private tick = 0;

  // Internal simulation state
  private internalState: InternalState = 'normal';
  private stateTimer = 0;
  private stateDuration = 0;

  // Smooth values
  private headPose: HeadPose = { yaw: 0, pitch: 0, roll: 0 };
  private gazeX = 0.5;
  private gazeY = 0.5;
  private drowsinessScore = 0;
  private distractionScore = 0;
  private perclos = 0;
  private blinkRate = 15;
  private blinkDuration = 150;
  private yawnCount = 0;
  private phoneConfidence = 0;

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.tick = 0;
    this.transitionState('normal');

    this.intervalId = setInterval(() => {
      this.tick++;
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

  onData(callback: (data: DMSTelemetry) => void): void {
    this.callback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private transitionState(newState: InternalState): void {
    this.internalState = newState;
    this.stateTimer = 0;

    switch (newState) {
      case 'normal':
        this.stateDuration = 80 + Math.random() * 120; // 8-20s
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

    // State machine transitions
    if (this.stateTimer >= this.stateDuration) {
      this.advanceState();
    }

    // Generate data based on current internal state
    const telemetry = this.generateTelemetry(t);

    if (this.callback) {
      this.callback(telemetry);
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

  private generateTelemetry(t: number): DMSTelemetry {
    const lerpRate = 0.08;

    // Target values based on state
    let targetDrowsiness = 0;
    let targetDistraction = 0;
    let targetPerclos = 0;
    let targetBlinkRate = 15;
    let targetBlinkDuration = 150;
    let targetPhoneConf = 0;
    let targetGazeX = 0.5;
    let targetGazeY = 0.5;
    let gazeOnRoad = true;
    let targetYaw = 0;
    let targetPitch = 0;

    switch (this.internalState) {
      case 'normal':
        targetDrowsiness = 5 + Math.random() * 10;
        targetDistraction = 5 + Math.random() * 8;
        targetPerclos = 5 + Math.random() * 5;
        targetBlinkRate = 14 + Math.random() * 4;
        targetBlinkDuration = 120 + Math.random() * 60;
        targetGazeX = 0.45 + smoothNoise(t, 0.3) * 0.1;
        targetGazeY = 0.45 + smoothNoise(t, 0.25) * 0.08;
        gazeOnRoad = true;
        targetYaw = smoothNoise(t, 0.2) * 10;
        targetPitch = smoothNoise(t, 0.15) * 5;
        break;

      case 'getting_drowsy':
        targetDrowsiness = 35 + Math.random() * 20;
        targetDistraction = 15 + Math.random() * 10;
        targetPerclos = 20 + Math.random() * 15;
        targetBlinkRate = 10 + Math.random() * 4;
        targetBlinkDuration = 250 + Math.random() * 100;
        targetGazeX = 0.45 + smoothNoise(t, 0.2) * 0.08;
        targetGazeY = 0.55 + smoothNoise(t, 0.15) * 0.1;
        gazeOnRoad = true;
        targetYaw = smoothNoise(t, 0.1) * 8;
        targetPitch = 5 + smoothNoise(t, 0.12) * 8;
        break;

      case 'drowsy':
        targetDrowsiness = 70 + Math.random() * 20;
        targetDistraction = 25 + Math.random() * 15;
        targetPerclos = 40 + Math.random() * 25;
        targetBlinkRate = 6 + Math.random() * 4;
        targetBlinkDuration = 400 + Math.random() * 200;
        targetGazeX = 0.4 + smoothNoise(t, 0.15) * 0.12;
        targetGazeY = 0.6 + smoothNoise(t, 0.1) * 0.12;
        gazeOnRoad = Math.random() > 0.3;
        targetYaw = smoothNoise(t, 0.08) * 15;
        targetPitch = 10 + smoothNoise(t, 0.1) * 12;
        break;

      case 'recovering':
        targetDrowsiness = 20 + Math.random() * 15;
        targetDistraction = 10 + Math.random() * 8;
        targetPerclos = 10 + Math.random() * 8;
        targetBlinkRate = 18 + Math.random() * 6;
        targetBlinkDuration = 140 + Math.random() * 40;
        targetGazeX = 0.5 + smoothNoise(t, 0.4) * 0.06;
        targetGazeY = 0.45 + smoothNoise(t, 0.35) * 0.05;
        gazeOnRoad = true;
        targetYaw = smoothNoise(t, 0.3) * 12;
        targetPitch = smoothNoise(t, 0.25) * 6;
        break;

      case 'phone_check':
        targetDrowsiness = 5 + Math.random() * 8;
        targetDistraction = 60 + Math.random() * 25;
        targetPerclos = 5 + Math.random() * 5;
        targetBlinkRate = 12 + Math.random() * 4;
        targetBlinkDuration = 140 + Math.random() * 40;
        targetPhoneConf = 70 + Math.random() * 25;
        targetGazeX = 0.2 + smoothNoise(t, 0.5) * 0.1;
        targetGazeY = 0.7 + smoothNoise(t, 0.4) * 0.08;
        gazeOnRoad = false;
        targetYaw = -25 + smoothNoise(t, 0.3) * 8;
        targetPitch = 15 + smoothNoise(t, 0.25) * 5;
        break;

      case 'distracted':
        targetDrowsiness = 5 + Math.random() * 10;
        targetDistraction = 50 + Math.random() * 30;
        targetPerclos = 5 + Math.random() * 5;
        targetBlinkRate = 14 + Math.random() * 4;
        targetBlinkDuration = 130 + Math.random() * 50;
        targetGazeX = 0.15 + Math.random() * 0.7;
        targetGazeY = 0.2 + Math.random() * 0.6;
        gazeOnRoad = false;
        targetYaw = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20);
        targetPitch = smoothNoise(t, 0.2) * 10;
        break;
    }

    // Smooth lerp values
    this.drowsinessScore = lerp(this.drowsinessScore, targetDrowsiness, lerpRate);
    this.distractionScore = lerp(this.distractionScore, targetDistraction, lerpRate);
    this.perclos = lerp(this.perclos, targetPerclos, lerpRate);
    this.blinkRate = lerp(this.blinkRate, targetBlinkRate, lerpRate);
    this.blinkDuration = lerp(this.blinkDuration, targetBlinkDuration, lerpRate);
    this.phoneConfidence = lerp(this.phoneConfidence, targetPhoneConf, lerpRate);
    this.gazeX = lerp(this.gazeX, clamp(targetGazeX, 0, 1), lerpRate);
    this.gazeY = lerp(this.gazeY, clamp(targetGazeY, 0, 1), lerpRate);

    this.headPose = {
      yaw: lerp(this.headPose.yaw, clamp(targetYaw, -90, 90), lerpRate),
      pitch: lerp(this.headPose.pitch, clamp(targetPitch, -90, 90), lerpRate),
      roll: lerp(this.headPose.roll, clamp(smoothNoise(t, 0.18) * 8, -90, 90), lerpRate),
    };

    // Increment yawn count occasionally during drowsy states
    if (
      (this.internalState === 'drowsy' || this.internalState === 'getting_drowsy') &&
      Math.random() < 0.005
    ) {
      this.yawnCount++;
    }

    // Map internal state to driver state
    const driverState = this.mapDriverState();

    const headPose: HeadPose = {
      yaw: Math.round(this.headPose.yaw * 10) / 10,
      pitch: Math.round(this.headPose.pitch * 10) / 10,
      roll: Math.round(this.headPose.roll * 10) / 10,
    };

    const gaze: GazeData = {
      x: Math.round(this.gazeX * 1000) / 1000,
      y: Math.round(this.gazeY * 1000) / 1000,
      onRoad: gazeOnRoad,
    };

    const drowsiness: DrowsinessMetrics = {
      perclos: Math.round(this.perclos * 10) / 10,
      blinkRate: Math.round(this.blinkRate * 10) / 10,
      blinkDuration: Math.round(this.blinkDuration),
      yawnCount: this.yawnCount,
      score: Math.round(this.drowsinessScore * 10) / 10,
    };

    const distraction: DistractionMetrics = {
      score: Math.round(this.distractionScore * 10) / 10,
      gazeOffRoad: !gazeOnRoad,
      duration_ms: !gazeOnRoad ? Math.round(this.stateTimer * 100) : 0,
    };

    const seatbelt: SeatbeltStatus = {
      worn: true,
      confidence: 98 + Math.random() * 2,
    };

    const phoneSuspicion: PhoneSuspicion = {
      detected: this.internalState === 'phone_check',
      confidence: Math.round(this.phoneConfidence * 10) / 10,
      handPosition: this.internalState === 'phone_check' ? 'right_hand_raised' : 'on_wheel',
    };

    const confidence: DMSConfidence = {
      overall: 92 + smoothNoise(t, 0.1) * 5,
      faceDetected: true,
      eyesVisible: this.internalState !== 'drowsy' || Math.random() > 0.2,
      quality: this.getImageQuality(t),
    };

    const adasFusion: ADASFusion = {
      ready: this.drowsinessScore < 60 && this.distractionScore < 70,
      laneKeepAssist: this.drowsinessScore < 50,
      collisionWarning: true,
      speedAdaptation: this.distractionScore < 60,
      integrationScore: clamp(95 - this.drowsinessScore * 0.3 - this.distractionScore * 0.2, 0, 100),
    };

    return {
      timestamp: Date.now(),
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

  private mapDriverState(): DriverState {
    switch (this.internalState) {
      case 'normal':
      case 'recovering':
        return DriverState.ATTENTIVE;
      case 'getting_drowsy':
        return DriverState.DROWSY;
      case 'drowsy':
        return DriverState.FATIGUED;
      case 'phone_check':
        return DriverState.PHONE_USE;
      case 'distracted':
        return DriverState.DISTRACTED;
      default:
        return DriverState.ATTENTIVE;
    }
  }

  private getImageQuality(t: number): string {
    const noise = smoothNoise(t, 0.05);
    if (noise > 0.3) return 'good';
    if (noise > -0.3) return 'fair';
    return 'poor';
  }
}
