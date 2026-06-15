import React from 'react';
import { DMSTelemetry } from '../../types/dms';

interface RightHeadPanelProps {
  data: DMSTelemetry;
}

export const RightHeadPanel: React.FC<RightHeadPanelProps> = ({ data }) => {
  const { yaw, pitch, roll } = data.headPose;
  const gazeOnRoad = data.gaze.onRoad;

  // Gaze direction for the unified beam
  const gazeX = (data.gaze.x - 0.5) * 80;
  const gazeY = (data.gaze.y - 0.5) * 60;

  return (
    <div className="bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] p-3 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3D Head Model</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          gazeOnRoad ? 'text-dms-success bg-dms-success/10' : 'text-dms-warning bg-dms-warning/10'
        }`}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
      </div>

      {/* 3D Head Visualization */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {/* Perspective container */}
        <div
          className="relative"
          style={{
            perspective: '600px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          {/* 0-axis reference lines (stationary) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '240px', height: '240px', left: '-10px', top: '-10px' }}>
            {/* Vertical center line */}
            <line x1="120" y1="30" x2="120" y2="210" stroke="#1a2840" strokeWidth="1" strokeDasharray="4,4" />
            {/* Horizontal center line */}
            <line x1="30" y1="120" x2="210" y2="120" stroke="#1a2840" strokeWidth="1" strokeDasharray="4,4" />
            {/* Reference label */}
            <text x="120" y="225" textAnchor="middle" fill="#334155" fontSize="8">0-AXIS REF</text>
          </svg>

          {/* Rotatable head */}
          <div
            style={{
              transform: `rotateY(${yaw}deg) rotateX(${-pitch}deg) rotateZ(${roll}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out',
              width: '220px',
              height: '220px',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Head oval */}
              <ellipse
                cx="100"
                cy="90"
                rx="50"
                ry="65"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="1.5"
                opacity="0.7"
              />

              {/* Wireframe cross lines on face */}
              <path
                d="M 50,90 Q 100,85 150,90"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <path
                d="M 100,25 Q 98,90 100,155"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.8"
                opacity="0.4"
              />

              {/* Horizontal wireframe lines */}
              <path d="M 55,60 Q 100,55 145,60" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 52,75 Q 100,70 148,75" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 52,105 Q 100,100 148,105" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 55,120 Q 100,118 145,120" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />

              {/* Nose ridge */}
              <path
                d="M 100,60 L 97,85 L 93,100 L 100,105 L 107,100 L 103,85 Z"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="1"
                opacity="0.6"
              />

              {/* Left eye socket */}
              <ellipse cx="78" cy="78" rx="14" ry="8" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
              {/* Right eye socket */}
              <ellipse cx="122" cy="78" rx="14" ry="8" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />

              {/* Eye pupils */}
              <circle cx="78" cy="78" r="3" fill="#00d4ff" opacity="0.6" />
              <circle cx="122" cy="78" r="3" fill="#00d4ff" opacity="0.6" />

              {/* Mouth */}
              <path d="M 82,125 Q 100,132 118,125" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />

              {/* Left ear */}
              <path d="M 50,75 Q 42,85 45,100 Q 48,110 52,105" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
              {/* Right ear */}
              <path d="M 150,75 Q 158,85 155,100 Q 152,110 148,105" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />

              {/* Neck */}
              <path d="M 85,155 L 85,180 M 115,155 L 115,180" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
              <path d="M 75,180 L 125,180" stroke="#00d4ff" strokeWidth="1" opacity="0.3" />

              {/* Unified center gaze beam/cone from face center */}
              <defs>
                <linearGradient id="gazeBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gazeOnRoad ? '#00e676' : '#ff6b35'} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={gazeOnRoad ? '#00e676' : '#ff6b35'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Gaze beam from center of face */}
              <polygon
                points={`100,82 ${100 + gazeX - 10},${82 + gazeY - 40} ${100 + gazeX + 10},${82 + gazeY - 40}`}
                fill="url(#gazeBeamGradient)"
                opacity="0.5"
              />
              <line
                x1="100"
                y1="82"
                x2={100 + gazeX}
                y2={82 + gazeY - 40}
                stroke={gazeOnRoad ? '#00e676' : '#ff6b35'}
                strokeWidth="1.5"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Yaw/Pitch/Roll Values */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-700/50">
        <div className="text-center">
          <span className="text-[9px] text-slate-500 block">YAW</span>
          <span className="text-xs font-mono text-dms-accent">{yaw.toFixed(1)}&deg;</span>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-slate-500 block">PITCH</span>
          <span className="text-xs font-mono text-dms-accent">{pitch.toFixed(1)}&deg;</span>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-slate-500 block">ROLL</span>
          <span className="text-xs font-mono text-dms-accent">{roll.toFixed(1)}&deg;</span>
        </div>
      </div>
    </div>
  );
};
