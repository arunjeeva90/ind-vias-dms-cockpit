import React from 'react';
import { DMSTelemetry } from '../../types/dms';

interface RightHeadPanelProps {
  data: DMSTelemetry;
}

export const RightHeadPanel: React.FC<RightHeadPanelProps> = ({ data }) => {
  const { yaw, pitch, roll } = data.headPose;
  const gazeOnRoad = data.gaze.onRoad;

  // Clamp CSS rotation to +-45 degrees for visual stability
  const clampedYaw = Math.max(-45, Math.min(45, yaw));
  const clampedPitch = Math.max(-45, Math.min(45, pitch));
  const clampedRoll = Math.max(-45, Math.min(45, roll));

  // Gaze direction for the unified beam
  const gazeX = (data.gaze.x - 0.5) * 80;
  const gazeY = (data.gaze.y - 0.5) * 60;

  // Panel border glow based on gaze state
  const panelBorderStyle = gazeOnRoad
    ? { boxShadow: '0 0 12px rgba(0, 212, 255, 0.3), inset 0 0 4px rgba(0, 212, 255, 0.05)' }
    : { boxShadow: '0 0 12px rgba(255, 107, 53, 0.3), inset 0 0 4px rgba(255, 107, 53, 0.05)' };

  return (
    <div
      className={`bg-dms-panel rounded-lg border p-3 flex flex-col h-full ${
        gazeOnRoad ? 'border-dms-accent/30' : 'border-dms-warning/30'
      }`}
      style={panelBorderStyle}
    >
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
      <div
        className="flex-1 flex items-center justify-center relative min-h-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.03) 0%, transparent 70%)',
        }}
      >
        {/* Perspective container */}
        <div
          className="relative"
          style={{
            perspective: '600px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          {/* 0-axis reference lines (stationary) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '280px', height: '280px', left: '-10px', top: '-10px' }}>
            {/* Vertical center line - solid thin white */}
            <line x1="140" y1="20" x2="140" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Horizontal center line - solid thin white */}
            <line x1="20" y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Axis labels */}
            <text x="262" y="143" textAnchor="start" fill="#64748b" fontSize="8" fontWeight="bold">YAW</text>
            <text x="140" y="14" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">PITCH</text>
          </svg>

          {/* Rotatable head */}
          <div
            style={{
              transform: `rotateY(${clampedYaw}deg) rotateX(${-clampedPitch}deg) rotateZ(${clampedRoll}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out',
              width: '260px',
              height: '260px',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                {/* Left eye radial gradient */}
                <radialGradient id="rhp-leftEyeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
                  <stop offset="60%" stopColor="#00d4ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
                {/* Right eye radial gradient */}
                <radialGradient id="rhp-rightEyeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
                  <stop offset="60%" stopColor="#00d4ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
                {/* Gaze cone gradient */}
                <linearGradient id="rhp-gazeConeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={gazeOnRoad ? '#00e676' : '#ff6b35'} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={gazeOnRoad ? '#00e676' : '#ff6b35'} stopOpacity="0.05" />
                </linearGradient>
              </defs>

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

              {/* Primary wireframe cross lines on face */}
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

              {/* Dense latitude (horizontal) wireframe lines - 8 additional */}
              <path d="M 62,40 Q 100,36 138,40" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 56,50 Q 100,46 144,50" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 53,60 Q 100,55 147,60" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 51,70 Q 100,66 149,70" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 50,80 Q 100,76 150,80" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 51,100 Q 100,96 149,100" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 52,110 Q 100,107 148,110" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 54,120 Q 100,118 146,120" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 57,130 Q 100,128 143,130" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 62,140 Q 100,138 138,140" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />

              {/* Dense longitude (vertical) wireframe lines - 6 additional */}
              <path d="M 75,28 Q 73,90 75,152" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 85,26 Q 83,90 85,154" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 115,26 Q 117,90 115,154" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 125,28 Q 127,90 125,152" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 65,32 Q 62,90 65,148" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.2" />
              <path d="M 135,32 Q 138,90 135,148" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.2" />

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

              {/* Left eye glow point - larger pulsing */}
              <circle cx="78" cy="78" r="5" fill="url(#rhp-leftEyeGlow)" opacity="0.8">
                <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Right eye glow point - larger pulsing */}
              <circle cx="122" cy="78" r="5" fill="url(#rhp-rightEyeGlow)" opacity="0.8">
                <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Mouth */}
              <path d="M 82,125 Q 100,132 118,125" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />

              {/* Left ear */}
              <path d="M 50,75 Q 42,85 45,100 Q 48,110 52,105" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
              {/* Right ear */}
              <path d="M 150,75 Q 158,85 155,100 Q 152,110 148,105" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />

              {/* Neck */}
              <path d="M 85,155 L 85,180 M 115,155 L 115,180" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
              <path d="M 75,180 L 125,180" stroke="#00d4ff" strokeWidth="1" opacity="0.3" />

              {/* Unified center gaze cone from midpoint between eyes (cx=100, cy=78) */}
              {/* Wider cone: spread +-20px at the tip */}
              <polygon
                points={`100,78 ${100 + gazeX - 20},${78 + gazeY - 50} ${100 + gazeX + 20},${78 + gazeY - 50}`}
                fill="url(#rhp-gazeConeGradient)"
                opacity="0.4"
              />
              {/* Center gaze line - more prominent */}
              <line
                x1="100"
                y1="78"
                x2={100 + gazeX}
                y2={78 + gazeY - 50}
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
