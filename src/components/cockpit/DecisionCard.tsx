import React from 'react';
import { AlertTriangle, Shield, Zap } from 'lucide-react';
import { DriverState, DMSTelemetry } from '../../types/dms';

interface DecisionCardProps {
  data: DMSTelemetry;
}

interface DecisionInfo {
  stateLabel: string;
  stateBadgeColor: string;
  primaryCause: string;
  secondaryCause: string;
  hmiAction: string;
}

function deriveDecision(data: DMSTelemetry): DecisionInfo {
  switch (data.driverState) {
    case DriverState.DROWSY:
      return {
        stateLabel: 'DROWSY',
        stateBadgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
        primaryCause: `High PERCLOS (${data.drowsiness.perclos.toFixed(0)}%)`,
        secondaryCause: `Blink rate: ${data.drowsiness.blinkRate.toFixed(0)} bpm`,
        hmiAction: 'Audio warning + seat vibration',
      };
    case DriverState.DISTRACTED:
      return {
        stateLabel: 'DISTRACTED',
        stateBadgeColor: 'bg-dms-warning/20 text-dms-warning border-dms-warning/40',
        primaryCause: `Gaze off road (${(data.distraction.duration_ms / 1000).toFixed(1)}s)`,
        secondaryCause: `Distraction score: ${data.distraction.score.toFixed(0)}%`,
        hmiAction: 'Visual HUD alert',
      };
    case DriverState.FATIGUED:
      return {
        stateLabel: 'FATIGUED',
        stateBadgeColor: 'bg-dms-danger/20 text-dms-danger border-dms-danger/40',
        primaryCause: `Fatigue score critical`,
        secondaryCause: `Yawn count: ${data.drowsiness.yawnCount}`,
        hmiAction: 'Haptic alert + rest stop suggestion',
      };
    case DriverState.PHONE_USE:
      return {
        stateLabel: 'PHONE USE',
        stateBadgeColor: 'bg-dms-danger/20 text-dms-danger border-dms-danger/40',
        primaryCause: `Phone detected (${data.phoneSuspicion.confidence.toFixed(0)}%)`,
        secondaryCause: `Hand: ${data.phoneSuspicion.handPosition}`,
        hmiAction: 'Audio warning + ADAS takeover prep',
      };
    default:
      return {
        stateLabel: 'NORMAL',
        stateBadgeColor: 'bg-dms-success/20 text-dms-success border-dms-success/40',
        primaryCause: 'All metrics nominal',
        secondaryCause: 'Attention sustained',
        hmiAction: 'No action required',
      };
  }
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ data }) => {
  const decision = deriveDecision(data);

  return (
    <div className="bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] p-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-dms-accent" />
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Decision</span>
      </div>

      {/* State Badge */}
      <div className={`text-xs font-bold px-2 py-1 rounded border text-center ${decision.stateBadgeColor}`}>
        {decision.stateLabel}
      </div>

      {/* Causes */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-slate-500 w-14 shrink-0 mt-0.5">PRIMARY</span>
          <span className="text-[11px] text-slate-300">{decision.primaryCause}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-slate-500 w-14 shrink-0 mt-0.5">SECOND.</span>
          <span className="text-[11px] text-slate-300">{decision.secondaryCause}</span>
        </div>
      </div>

      {/* HMI Action */}
      <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-700/50">
        <Zap className="w-3 h-3 text-dms-warning" />
        <span className="text-[10px] text-dms-warning">{decision.hmiAction}</span>
      </div>

      {/* ADAS Readiness */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
        <Shield className="w-3 h-3 text-dms-accent" />
        <span className="text-[10px] text-slate-400">ADAS Fusion</span>
        <span className={`text-[10px] font-mono ${data.adasFusion.ready ? 'text-dms-success' : 'text-dms-danger'}`}>
          {data.adasFusion.ready ? 'READY' : 'NOT READY'}
        </span>
      </div>

      {/* ADAS Sub-indicators */}
      <div className="grid grid-cols-3 gap-1">
        <div className="text-center">
          <div className={`w-2 h-2 rounded-full mx-auto ${data.adasFusion.laneKeepAssist ? 'bg-dms-success' : 'bg-slate-600'}`} />
          <span className="text-[8px] text-slate-500">LKA</span>
        </div>
        <div className="text-center">
          <div className={`w-2 h-2 rounded-full mx-auto ${data.adasFusion.collisionWarning ? 'bg-dms-success' : 'bg-slate-600'}`} />
          <span className="text-[8px] text-slate-500">FCW</span>
        </div>
        <div className="text-center">
          <div className={`w-2 h-2 rounded-full mx-auto ${data.adasFusion.speedAdaptation ? 'bg-dms-success' : 'bg-slate-600'}`} />
          <span className="text-[8px] text-slate-500">ISA</span>
        </div>
      </div>
    </div>
  );
};
