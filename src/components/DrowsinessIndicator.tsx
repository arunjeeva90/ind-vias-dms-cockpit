import React from 'react';
import { DrowsinessMetrics } from '../types/dms';

interface DrowsinessIndicatorProps {
  drowsiness: DrowsinessMetrics;
}

function getScoreColor(score: number): string {
  if (score < 25) return '#00e676';
  if (score < 50) return '#ffeb3b';
  if (score < 75) return '#ff6b35';
  return '#ff2d55';
}

function getScoreTextClass(score: number): string {
  if (score < 25) return 'text-dms-success';
  if (score < 50) return 'text-yellow-400';
  if (score < 75) return 'text-dms-warning';
  return 'text-dms-danger';
}

export const DrowsinessIndicator: React.FC<DrowsinessIndicatorProps> = ({ drowsiness }) => {
  const scoreColor = getScoreColor(drowsiness.score);
  const scoreTextClass = getScoreTextClass(drowsiness.score);

  // Circular progress for PERCLOS
  const perclosRadius = 28;
  const perclosCircumference = 2 * Math.PI * perclosRadius;
  const perclosOffset = perclosCircumference - (drowsiness.perclos / 100) * perclosCircumference;

  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        Drowsiness
      </h3>

      <div className="flex items-center justify-around mb-3">
        {/* PERCLOS circular gauge */}
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 70 70" className="w-16 h-16">
            <circle
              cx="35"
              cy="35"
              r={perclosRadius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="5"
            />
            <circle
              cx="35"
              cy="35"
              r={perclosRadius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="5"
              strokeDasharray={perclosCircumference}
              strokeDashoffset={perclosOffset}
              strokeLinecap="round"
              transform="rotate(-90 35 35)"
              className="transition-all duration-200"
            />
            <text
              x="35"
              y="37"
              textAnchor="middle"
              className="text-[10px] fill-slate-200 font-bold"
            >
              {drowsiness.perclos.toFixed(0)}%
            </text>
          </svg>
          <span className="text-[10px] text-slate-400 uppercase">PERCLOS</span>
        </div>

        {/* Metrics column */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Blink Rate</span>
            <span className="text-slate-200 font-mono">{drowsiness.blinkRate.toFixed(0)}/min</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Blink Dur.</span>
            <span className="text-slate-200 font-mono">{drowsiness.blinkDuration}ms</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Yawns</span>
            <span className="text-slate-200 font-mono">{drowsiness.yawnCount}</span>
          </div>
        </div>
      </div>

      {/* Drowsiness score bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-400 uppercase">Score</span>
          <span className={`text-xs font-bold font-mono ${scoreTextClass}`}>
            {drowsiness.score.toFixed(0)}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${Math.min(drowsiness.score, 100)}%`,
              backgroundColor: scoreColor,
            }}
          />
        </div>
      </div>
    </div>
  );
};
