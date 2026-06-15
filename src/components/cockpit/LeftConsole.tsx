import React from 'react';
import {
  Camera,
  Eye,
  EyeOff,
  Focus,
  Phone,
  Cigarette,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { DriverState, DMSTelemetry } from '../../types/dms';

interface LeftConsoleProps {
  data: DMSTelemetry;
}

type OverallState = 'NORMAL' | 'MONITOR' | 'WARNING' | 'DANGER' | 'DEGRADED';

function mapDriverState(state: DriverState, confidence: number): OverallState {
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

function getOverallStateStyles(state: OverallState): string {
  switch (state) {
    case 'NORMAL':
      return 'bg-dms-success/20 text-dms-success border-dms-success/50';
    case 'MONITOR':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
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

interface SectionHeaderProps {
  label: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ label }) => (
  <div className="section-header">
    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
  </div>
);

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  glowColor: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, color, glowColor }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-slate-400 w-20 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          boxShadow: `0 0 4px ${glowColor}`,
        }}
      />
    </div>
    <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
      {(value * 100).toFixed(0)}%
    </span>
  </div>
);

interface BehaviorIconProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  danger?: boolean;
}

const BehaviorIcon: React.FC<BehaviorIconProps> = ({ icon, label, active, danger }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner ${
        active
          ? danger
            ? 'bg-dms-danger/20 text-dms-danger'
            : 'bg-dms-success/20 text-dms-success'
          : 'bg-slate-800/50 text-slate-600'
      }`}
    >
      {icon}
    </div>
    <span className="text-[7px] text-slate-500 uppercase">{label}</span>
  </div>
);

export const LeftConsole: React.FC<LeftConsoleProps> = ({ data }) => {
  const overallState = mapDriverState(data.driverState, data.confidence.overall);
  const faceTracking = data.confidence.faceDetected ? 'LOCKED' : 'LOST';

  // Derive attention score: inverse of distraction (distraction.score is 0-100)
  const attention = 1 - data.distraction.score / 100;
  // Availability: combination of confidence and seatbelt
  const availability = data.confidence.overall * (data.seatbelt.worn ? 1 : 0.5);

  return (
    <div className="bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] p-3 flex flex-col gap-4 overflow-y-auto h-full scrollbar-hide">
      {/* DRIVER Section Header */}
      <SectionHeader label="DRIVER" />

      {/* Driver ID & Tracking */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Driver ID</span>
          <span className="text-xs font-mono text-dms-accent">D1</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Face Track</span>
          <span className={`text-xs font-mono font-bold ${faceTracking === 'LOCKED' ? 'text-dms-success' : 'text-dms-danger'}`}>
            {faceTracking}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">DMS Conf.</span>
          <span className="text-xs font-mono text-dms-accent">
            {(data.confidence.overall * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* STATE Section Header */}
      <SectionHeader label="STATE" />

      {/* Large State Badge */}
      <div className={`text-center py-3 rounded-md border font-bold text-base tracking-wider ${getOverallStateStyles(overallState)} ${overallState !== 'NORMAL' ? 'animate-pulse-border' : ''}`}>
        {overallState}
      </div>

      {/* BEHAVIOR Section Header */}
      <SectionHeader label="BEHAVIOR" />

      {/* Progress Bars */}
      <div className="space-y-2">
        <ProgressBar label="Attention" value={attention} color="bg-dms-success" glowColor="rgba(0, 230, 118, 0.4)" />
        <ProgressBar label="Drowsiness" value={data.drowsiness.score / 100} color="bg-yellow-400" glowColor="rgba(250, 204, 21, 0.4)" />
        <ProgressBar label="Distraction" value={data.distraction.score / 100} color="bg-dms-warning" glowColor="rgba(255, 107, 53, 0.4)" />
        <ProgressBar label="Availability" value={availability} color="bg-dms-accent" glowColor="rgba(0, 212, 255, 0.4)" />
      </div>

      {/* Behavior Icons */}
      <div className="grid grid-cols-5 gap-2">
        <BehaviorIcon icon={<Camera className="w-4 h-4" />} label="Cam" active={data.confidence.faceDetected} />
        <BehaviorIcon icon={<Eye className="w-4 h-4" />} label="Awake" active={data.drowsiness.score < 50} />
        <BehaviorIcon icon={<Focus className="w-4 h-4" />} label="Attn" active={data.gaze.onRoad} />
        <BehaviorIcon icon={<ShieldCheck className="w-4 h-4" />} label="Belt" active={data.seatbelt.worn} />
        <BehaviorIcon icon={<Phone className="w-4 h-4" />} label="Phone" active={data.phoneSuspicion.detected} danger />
        <BehaviorIcon icon={<Cigarette className="w-4 h-4" />} label="Smoke" active={false} danger />
        <BehaviorIcon icon={<EyeOff className="w-4 h-4" />} label="Yawn" active={data.drowsiness.yawnCount > 0} danger />
        <BehaviorIcon icon={<AlertCircle className="w-4 h-4" />} label="Occl" active={!data.confidence.eyesVisible} danger />
        <BehaviorIcon icon={<MessageSquare className="w-4 h-4" />} label="Talk" active={false} />
      </div>

      {/* ENGINEERING Section Header */}
      <SectionHeader label="ENGINEERING" />

      {/* Engineering Readout */}
      <div className="space-y-0.5">
        <div className="font-mono text-[10px] text-slate-400 space-y-0.5 bg-slate-900/50 rounded p-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Head Yaw</span>
            <span className="text-dms-accent">{data.headPose.yaw.toFixed(1)}&deg;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Head Pitch</span>
            <span className="text-dms-accent">{data.headPose.pitch.toFixed(1)}&deg;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Head Roll</span>
            <span className="text-dms-accent">{data.headPose.roll.toFixed(1)}&deg;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gaze X</span>
            <span className="text-dms-accent">{data.gaze.x.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gaze Y</span>
            <span className="text-dms-accent">{data.gaze.y.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">PERCLOS</span>
            <span className="text-dms-accent">{data.drowsiness.perclos.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Blink Rate</span>
            <span className="text-dms-accent">{data.drowsiness.blinkRate.toFixed(0)} bpm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Eyes Off</span>
            <span className={data.distraction.gazeOffRoad ? 'text-dms-danger' : 'text-dms-success'}>
              {data.distraction.gazeOffRoad ? `${(data.distraction.duration_ms / 1000).toFixed(1)}s` : '0.0s'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
