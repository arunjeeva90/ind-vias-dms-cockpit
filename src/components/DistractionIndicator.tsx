import React from 'react';
import { DistractionMetrics } from '../types/dms';

interface DistractionIndicatorProps {
  distraction: DistractionMetrics;
}

function getScoreColor(score: number): string {
  if (score < 30) return '#00e676';
  if (score < 55) return '#ffeb3b';
  if (score < 75) return '#ff6b35';
  return '#ff2d55';
}

export const DistractionIndicator: React.FC<DistractionIndicatorProps> = ({ distraction }) => {
  const color = getScoreColor(distraction.score);

  // Radial gauge SVG
  const cx = 50;
  const cy = 55;
  const radius = 35;
  const startAngle = -210;
  const endAngle = 30;
  const totalSweep = endAngle - startAngle; // 240 degrees
  const valueAngle = startAngle + (distraction.score / 100) * totalSweep;

  const polarToCartesian = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  const valuePos = polarToCartesian(valueAngle, radius);

  const largeArcFlag = totalSweep > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;

  // Value arc
  const valueSweep = distraction.score / 100 * totalSweep;
  const valueLargeArc = valueSweep > 180 ? 1 : 0;
  const valueArcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${valueLargeArc} 1 ${valuePos.x} ${valuePos.y}`;

  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        Distraction
      </h3>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 70" className="w-full h-auto max-w-[140px]">
          {/* Background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={valueArcPath}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            className="transition-all duration-200"
          />
          {/* Score text */}
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            className="text-[14px] fill-slate-100 font-bold font-mono"
          >
            {distraction.score.toFixed(0)}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="text-[7px] fill-slate-400 uppercase"
          >
            Score
          </text>
        </svg>
      </div>

      {/* Indicators */}
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              distraction.gazeOffRoad
                ? 'bg-dms-warning animate-pulse'
                : 'bg-slate-700'
            }`}
          />
          <span className="text-[10px] text-slate-400 uppercase">Gaze Off Road</span>
        </div>
        {distraction.gazeOffRoad && (
          <span className="text-xs font-mono text-dms-warning">
            {(distraction.duration_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
};
