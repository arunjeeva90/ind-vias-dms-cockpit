import React, { useRef, useEffect, useCallback } from 'react';
import { GazeData } from '../types/dms';

interface GazeVisualizationProps {
  gaze: GazeData;
}

const MAX_TRAIL_POINTS = 20;

export const GazeVisualization: React.FC<GazeVisualizationProps> = ({ gaze }) => {
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  const updateTrail = useCallback(() => {
    trailRef.current.push({ x: gaze.x, y: gaze.y });
    if (trailRef.current.length > MAX_TRAIL_POINTS) {
      trailRef.current.shift();
    }
  }, [gaze.x, gaze.y]);

  useEffect(() => {
    updateTrail();
  }, [updateTrail]);

  const trail = trailRef.current;

  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        Gaze Visualization
      </h3>
      <div className="relative">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          {/* Windshield outline */}
          <rect
            x="10"
            y="5"
            width="180"
            height="100"
            rx="8"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Road perspective lines */}
          <line x1="40" y1="105" x2="80" y2="50" stroke="#1e293b" strokeWidth="0.5" />
          <line x1="160" y1="105" x2="120" y2="50" stroke="#1e293b" strokeWidth="0.5" />
          <line x1="10" y1="60" x2="190" y2="60" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

          {/* Trail points */}
          {trail.map((point, i) => {
            const opacity = (i + 1) / trail.length * 0.5;
            const px = 10 + point.x * 180;
            const py = 5 + point.y * 100;
            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={1.5}
                fill="#00d4ff"
                opacity={opacity}
              />
            );
          })}

          {/* Current gaze point */}
          <circle
            cx={10 + gaze.x * 180}
            cy={5 + gaze.y * 100}
            r="5"
            fill={gaze.onRoad ? '#00d4ff' : '#ff6b35'}
            opacity="0.8"
            className="animate-pulse"
          />
          <circle
            cx={10 + gaze.x * 180}
            cy={5 + gaze.y * 100}
            r="8"
            fill="none"
            stroke={gaze.onRoad ? '#00d4ff' : '#ff6b35'}
            strokeWidth="1"
            opacity="0.4"
          />
        </svg>
      </div>
      {/* Status */}
      <div className="flex items-center justify-center mt-2 gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            gaze.onRoad ? 'bg-dms-success' : 'bg-dms-warning animate-pulse'
          }`}
        />
        <span
          className={`text-xs font-semibold uppercase ${
            gaze.onRoad ? 'text-dms-success' : 'text-dms-warning'
          }`}
        >
          {gaze.onRoad ? 'On Road' : 'Off Road'}
        </span>
      </div>
    </div>
  );
};
