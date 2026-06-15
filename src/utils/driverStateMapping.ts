import { DriverState, DMSConfidence } from '../types/dms';

/**
 * Unified overall state derived from DriverState + confidence.
 * Used consistently across all cockpit components.
 */
export type OverallState = 'NORMAL' | 'MONITOR' | 'WARNING' | 'DANGER' | 'DEGRADED';

/**
 * Camera health status derived from DMSConfidence fields.
 */
export type CameraHealth = 'OK' | 'FAIR' | 'DEGRADED' | 'NO FACE';

/**
 * Maps a DriverState enum value and confidence score to a unified OverallState.
 *
 * Rules:
 * - confidence < 0.3 => DEGRADED (regardless of state)
 * - ATTENTIVE => NORMAL
 * - DROWSY => MONITOR
 * - DISTRACTED => WARNING
 * - FATIGUED => DANGER
 * - PHONE_USE => DANGER
 */
export function mapDriverState(state: DriverState, confidence: number): OverallState {
  if (confidence < 0.3) return 'DEGRADED';
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'NORMAL';
    case DriverState.DROWSY:
      return 'MONITOR';
    case DriverState.DISTRACTED:
      return 'WARNING';
    case DriverState.FATIGUED:
      return 'DANGER';
    case DriverState.PHONE_USE:
      return 'DANGER';
    default:
      return 'NORMAL';
  }
}

/**
 * Returns the display label for a given OverallState.
 */
export function getStateLabel(state: OverallState): string {
  return state;
}

/**
 * Returns Tailwind text color class for a given OverallState.
 */
export function getStateColor(state: OverallState): string {
  switch (state) {
    case 'NORMAL':
      return 'text-dms-success';
    case 'MONITOR':
      return 'text-cyan-400';
    case 'WARNING':
      return 'text-dms-warning';
    case 'DANGER':
      return 'text-dms-danger';
    case 'DEGRADED':
      return 'text-slate-400';
    default:
      return 'text-slate-400';
  }
}

/**
 * Returns Tailwind badge styles (background, text, border) for a given OverallState.
 */
export function getStateBadgeStyles(state: OverallState): string {
  switch (state) {
    case 'NORMAL':
      return 'bg-dms-success/20 text-dms-success border-dms-success/50';
    case 'MONITOR':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    case 'WARNING':
      return 'bg-dms-warning/20 text-dms-warning border-dms-warning/50';
    case 'DANGER':
      return 'bg-dms-danger/20 text-dms-danger border-dms-danger/50';
    case 'DEGRADED':
      return 'bg-slate-700/30 text-slate-400 border-slate-600/50';
    default:
      return 'bg-slate-700/20 text-slate-400 border-slate-700/50';
  }
}

/**
 * Returns Tailwind background color class for state chips (timeline, ladder).
 */
export function getStateBgColor(state: OverallState): string {
  switch (state) {
    case 'NORMAL':
      return 'bg-dms-success';
    case 'MONITOR':
      return 'bg-cyan-400';
    case 'WARNING':
      return 'bg-amber-400';
    case 'DANGER':
      return 'bg-dms-danger';
    case 'DEGRADED':
      return 'bg-slate-500';
    default:
      return 'bg-slate-500';
  }
}

/**
 * Derives unified camera health status from DMSConfidence.
 * Considers both faceDetected and quality fields for consistency.
 *
 * Rules:
 * - faceDetected = false => 'NO FACE'
 * - quality = 'poor' => 'DEGRADED'
 * - quality = 'fair' => 'FAIR'
 * - quality = 'good' or 'excellent' => 'OK'
 */
export function getCameraHealth(confidence: DMSConfidence): CameraHealth {
  if (!confidence.faceDetected) return 'NO FACE';
  if (confidence.quality === 'poor') return 'DEGRADED';
  if (confidence.quality === 'fair') return 'FAIR';
  return 'OK';
}

/**
 * Returns Tailwind text color class for a camera health status.
 */
export function getCameraHealthColor(health: CameraHealth): string {
  switch (health) {
    case 'OK':
      return 'text-dms-success';
    case 'FAIR':
      return 'text-amber-400';
    case 'DEGRADED':
      return 'text-dms-warning';
    case 'NO FACE':
      return 'text-dms-danger';
    default:
      return 'text-slate-400';
  }
}
