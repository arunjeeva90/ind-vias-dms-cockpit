import React from 'react';
import { ADASFusion } from '../types/dms';

interface ADASFusionReadinessProps {
  adasFusion: ADASFusion;
}

interface SystemIndicatorProps {
  label: string;
  active: boolean;
}

const SystemIndicator: React.FC<SystemIndicatorProps> = ({ label, active }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-slate-400">{label}</span>
    <span
      className={`w-3 h-3 rounded-sm transition-all duration-300 ${
        active
          ? 'bg-dms-success shadow-sm shadow-dms-success/50'
          : 'bg-slate-700'
      }`}
    />
  </div>
);

export const ADASFusionReadiness: React.FC<ADASFusionReadinessProps> = ({ adasFusion }) => {
  const readyColor = adasFusion.ready ? 'text-dms-success' : 'text-dms-warning';

  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        ADAS Fusion
      </h3>

      <div className="flex flex-col items-center">
        {/* Readiness status */}
        <div className={`text-sm font-bold uppercase mb-3 ${readyColor}`}>
          {adasFusion.ready ? 'Ready' : 'Limited'}
        </div>

        {/* System indicators */}
        <div className="w-full space-y-2 mb-4">
          <SystemIndicator label="Lane Keep Assist" active={adasFusion.laneKeepAssist} />
          <SystemIndicator label="Collision Warning" active={adasFusion.collisionWarning} />
          <SystemIndicator label="Speed Adaptation" active={adasFusion.speedAdaptation} />
        </div>

        {/* Integration score bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 uppercase">Integration</span>
            <span className="text-[10px] text-slate-300 font-mono">
              {adasFusion.integrationScore.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-dms-accent transition-all duration-200"
              style={{ width: `${Math.min(adasFusion.integrationScore, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
