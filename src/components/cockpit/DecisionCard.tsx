import React from 'react';
import { AlertTriangle, Shield, Zap } from 'lucide-react';
import { DriverState, DMSTelemetry } from '../../types/dms';
import { mapDriverState, getStateLabel, getStateBadgeStyles } from '../../utils/driverStateMapping';

interface DecisionCardProps {
  data: DMSTelemetry;
}

interface DecisionInfo {
  stateLabel: string;
  stateBadgeStyles: string;
  primaryCause: string;
  secondaryCause: string;
  hmiAction: string;
  whyExplanation: string;
}

function deriveDecision(data: DMSTelemetry): DecisionInfo {
  const overallState = mapDriverState(data.driverState, data.confidence.overall);
  const label = getStateLabel(overallState);
  const badgeStyles = getStateBadgeStyles(overallState);

  switch (data.driverState) {
    case DriverState.DROWSY:
      return {
        stateLabel: label,
        stateBadgeStyles: badgeStyles,
        primaryCause: `High PERCLOS (${data.drowsiness.perclos.toFixed(0)}%)`,
        secondaryCause: `Blink rate: ${data.drowsiness.blinkRate.toFixed(0)} bpm`,
        hmiAction: 'Audio warning + seat vibration',
        whyExplanation: 'Early drowsiness signs detected, monitoring escalation path',
      };
    case DriverState.DISTRACTED:
      return {
        stateLabel: label,
        stateBadgeStyles: badgeStyles,
        primaryCause: `Gaze off road (${(data.distraction.duration_ms / 1000).toFixed(1)}s)`,
        secondaryCause: `Distraction score: ${data.distraction.score.toFixed(0)}%`,
        hmiAction: 'Visual HUD alert',
        whyExplanation: 'Gaze-away threshold exceeded, driver intervention needed',
      };
    case DriverState.FATIGUED:
      return {
        stateLabel: label,
        stateBadgeStyles: badgeStyles,
        primaryCause: `Fatigue score critical`,
        secondaryCause: `Yawn count: ${data.drowsiness.yawnCount}`,
        hmiAction: 'Haptic alert + rest stop suggestion',
        whyExplanation: 'Critical state detected - immediate ADAS escalation required',
      };
    case DriverState.PHONE_USE:
      return {
        stateLabel: label,
        stateBadgeStyles: badgeStyles,
        primaryCause: `Phone detected (${data.phoneSuspicion.confidence.toFixed(0)}%)`,
        secondaryCause: `Hand: ${data.phoneSuspicion.handPosition}`,
        hmiAction: 'Audio warning + ADAS takeover prep',
        whyExplanation: 'Critical state detected - immediate ADAS escalation required',
      };
    default:
      return {
        stateLabel: label,
        stateBadgeStyles: badgeStyles,
        primaryCause: 'All metrics nominal',
        secondaryCause: 'Attention sustained',
        hmiAction: 'No action required',
        whyExplanation: 'All biometric indicators within safe thresholds',
      };
  }
}

function getDegradedReason(data: DMSTelemetry): string {
  if (data.confidence.overall >= 0.5) return 'None';
  if (!data.confidence.faceDetected) return 'Face not detected';
  if (!data.confidence.eyesVisible) return 'Eyes not visible';
  return 'Low signal quality';
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ data }) => {
  const decision = deriveDecision(data);
  const degradedReason = getDegradedReason(data);

  return (
    <div className="bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] p-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-dms-accent" />
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Decision</span>
      </div>

      {/* State Badge */}
      <div className={`text-xs font-bold px-2 py-1 rounded border text-center ${decision.stateBadgeStyles}`}>
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

      {/* Confidence */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
        <span className="text-[10px] text-slate-400">Confidence</span>
        <span className="text-[10px] font-mono text-dms-accent">
          {(data.confidence.overall * 100).toFixed(0)}%
        </span>
      </div>

      {/* Degraded Reason */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Degraded Reason</span>
        <span className={`text-[10px] font-mono ${degradedReason === 'None' ? 'text-slate-500' : 'text-dms-warning'}`}>
          {degradedReason}
        </span>
      </div>

      {/* ADAS Integration Score */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">ADAS Integration</span>
        <span className="text-[10px] font-mono text-dms-accent">
          {data.adasFusion.integrationScore.toFixed(0)}%
        </span>
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

      {/* Why Explanation */}
      <div className="pt-1 border-t border-slate-700/50">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Why?</span>
        <p className="text-[10px] text-slate-400 mt-0.5 italic">{decision.whyExplanation}</p>
      </div>
    </div>
  );
};
