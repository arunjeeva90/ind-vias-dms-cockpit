import React from 'react';
import { DMSConfidence as DMSConfidenceType } from '../types/dms';
import { Activity } from 'lucide-react';

interface DMSConfidenceProps {
  confidence: DMSConfidenceType;
}

function getQualityColor(quality: string): string {
  switch (quality) {
    case 'good':
      return 'text-dms-success';
    case 'fair':
      return 'text-yellow-400';
    case 'poor':
      return 'text-dms-danger';
    default:
      return 'text-slate-400';
  }
}

export const DMSConfidence: React.FC<DMSConfidenceProps> = ({ confidence }) => {
  const overallPct = Math.min(Math.max(confidence.overall * 100, 0), 100);

  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        System Confidence
      </h3>

      <div className="flex flex-col items-center">
        {/* Overall meter */}
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-dms-accent" />
          <span className="text-xl font-bold text-slate-100 font-mono">
            {overallPct.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-dms-accent transition-all duration-200"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {/* Indicators */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Face Detected</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                confidence.faceDetected ? 'bg-dms-success' : 'bg-dms-danger'
              }`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Eyes Visible</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                confidence.eyesVisible ? 'bg-dms-success' : 'bg-dms-danger'
              }`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Image Quality</span>
            <span className={`text-[10px] font-semibold uppercase ${getQualityColor(confidence.quality)}`}>
              {confidence.quality}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
