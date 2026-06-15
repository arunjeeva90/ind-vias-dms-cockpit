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

  // Eye openness derived from confidence
  const eyesOpen = data.confidence.eyesVisible;

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
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '300px', height: '320px', left: '-10px', top: '-10px' }}>
            {/* Vertical center line */}
            <line x1="160" y1="20" x2="160" y2="290" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Horizontal center line */}
            <line x1="20" y1="155" x2="300" y2="155" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Axis labels */}
            <text x="282" y="158" textAnchor="start" fill="#64748b" fontSize="8" fontWeight="bold">YAW</text>
            <text x="160" y="14" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">PITCH</text>
          </svg>

          {/* Rotatable head */}
          <div
            style={{
              transform: `rotateY(${clampedYaw}deg) rotateX(${-clampedPitch}deg) rotateZ(${clampedRoll}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out',
              width: '280px',
              height: '300px',
            }}
          >
            <svg viewBox="0 0 200 240" className="w-full h-full">
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
                {/* Iris glow gradient */}
                <radialGradient id="rhp-irisGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.3" />
                </radialGradient>
              </defs>

              {/* ===== HEAD OVAL ===== */}
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

              {/* ===== DENSE WIREFRAME MESH ===== */}

              {/* --- Forehead: 4 closely-spaced horizontal curves --- */}
              <path d="M 68,32 Q 100,27 132,32" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 62,38 Q 100,33 138,38" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.28" />
              <path d="M 58,44 Q 100,39 142,44" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.28" />
              <path d="M 55,50 Q 100,45 145,50" fill="none" stroke="#00d4ff" strokeWidth="0.45" opacity="0.3" />

              {/* --- Upper face latitude lines --- */}
              <path d="M 53,56 Q 100,51 147,56" fill="none" stroke="#00d4ff" strokeWidth="0.45" opacity="0.3" />
              <path d="M 51,63 Q 100,58 149,63" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 50,70 Q 100,66 150,70" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.32" />

              {/* --- Eye-level latitude lines --- */}
              <path d="M 50,78 Q 100,74 150,78" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.35" />
              <path d="M 50,85 Q 100,82 150,85" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />

              {/* --- Mid-face primary line --- */}
              <path d="M 50,92 Q 100,88 150,92" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.4" />

              {/* --- Lower face latitude lines --- */}
              <path d="M 51,99 Q 100,96 149,99" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 52,106 Q 100,103 148,106" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 54,113 Q 100,110 146,113" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 56,120 Q 100,117 144,120" fill="none" stroke="#00d4ff" strokeWidth="0.45" opacity="0.28" />
              <path d="M 60,128 Q 100,125 140,128" fill="none" stroke="#00d4ff" strokeWidth="0.45" opacity="0.28" />

              {/* --- Jaw/chin latitude lines --- */}
              <path d="M 65,135 Q 100,133 135,135" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 70,142 Q 100,140 130,142" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 78,148 Q 100,147 122,148" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.22" />

              {/* --- Center vertical longitude (primary) --- */}
              <path d="M 100,25 Q 98,90 100,155" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.4" />

              {/* --- Longitude lines (vertical curves) --- */}
              <path d="M 65,32 Q 62,90 65,148" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.22" />
              <path d="M 75,28 Q 73,90 75,152" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 85,26 Q 83,90 85,154" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 92,25 Q 91,90 92,155" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.22" />
              <path d="M 108,25 Q 109,90 108,155" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.22" />
              <path d="M 115,26 Q 117,90 115,154" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 125,28 Q 127,90 125,152" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 135,32 Q 138,90 135,148" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.22" />

              {/* --- Cheek diagonal mesh lines (2 per side) --- */}
              <path d="M 55,60 Q 60,85 65,110" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.2" />
              <path d="M 58,70 Q 63,95 70,120" fill="none" stroke="#00d4ff" strokeWidth="0.3" opacity="0.18" />
              <path d="M 145,60 Q 140,85 135,110" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.2" />
              <path d="M 142,70 Q 137,95 130,120" fill="none" stroke="#00d4ff" strokeWidth="0.3" opacity="0.18" />

              {/* --- Jawline contour curves (3 parallel) --- */}
              <path d="M 55,105 Q 58,130 75,148 Q 90,156 100,158 Q 110,156 125,148 Q 142,130 145,105" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
              <path d="M 58,108 Q 61,128 76,143 Q 90,150 100,152 Q 110,150 124,143 Q 139,128 142,108" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.25" />
              <path d="M 61,110 Q 64,126 77,138 Q 90,144 100,146 Q 110,144 123,138 Q 136,126 139,110" fill="none" stroke="#00d4ff" strokeWidth="0.35" opacity="0.2" />

              {/* ===== EYE SOCKET DETAIL (3-4 curves each) ===== */}
              {/* Left eye socket - larger */}
              <ellipse cx="78" cy="78" rx="16" ry="10" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
              <ellipse cx="78" cy="78" rx="12" ry="7" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.35" />
              <path d="M 64,73 Q 78,68 92,73" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />
              <path d="M 66,83 Q 78,87 90,83" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />
              {/* Right eye socket - larger */}
              <ellipse cx="122" cy="78" rx="16" ry="10" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
              <ellipse cx="122" cy="78" rx="12" ry="7" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.35" />
              <path d="M 108,73 Q 122,68 136,73" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />
              <path d="M 110,83 Q 122,87 134,83" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />

              {/* ===== NOSE MESH (triangular with 8 segments) ===== */}
              <path d="M 100,55 L 97,70" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.4" />
              <path d="M 100,55 L 103,70" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.4" />
              <path d="M 97,70 L 93,85" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.4" />
              <path d="M 103,70 L 107,85" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.4" />
              <path d="M 93,85 L 90,100" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.4" />
              <path d="M 107,85 L 110,100" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.4" />
              <path d="M 90,100 L 100,105 L 110,100" fill="none" stroke="#00d4ff" strokeWidth="0.7" opacity="0.5" />
              <path d="M 93,85 L 100,87 L 107,85" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />

              {/* ===== MOUTH MESH (4 curved lines) ===== */}
              <path d="M 82,120 Q 100,115 118,120" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.35" />
              <path d="M 82,125 Q 100,130 118,125" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5" />
              <path d="M 85,125 Q 100,128 115,125" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.35" />
              <path d="M 82,130 Q 100,135 118,130" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />

              {/* ===== EARS ===== */}
              <path d="M 50,75 Q 42,85 45,100 Q 48,110 52,105" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
              <path d="M 150,75 Q 158,85 155,100 Q 152,110 148,105" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />

              {/* ===== EYES - Larger sockets with iris ===== */}
              {/* Left eye glow point - pulsing */}
              <circle cx="78" cy="78" r="5" fill="url(#rhp-leftEyeGlow)" opacity="0.8">
                <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Left iris */}
              <circle cx="78" cy="78" r="3" fill="url(#rhp-irisGlow)" opacity="0.9" />
              {/* Right eye glow point - pulsing */}
              <circle cx="122" cy="78" r="5" fill="url(#rhp-rightEyeGlow)" opacity="0.8">
                <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Right iris */}
              <circle cx="122" cy="78" r="3" fill="url(#rhp-irisGlow)" opacity="0.9" />

              {/* ===== NECK (3 vertical lines) ===== */}
              <path d="M 88,155 L 88,185" stroke="#00d4ff" strokeWidth="0.8" opacity="0.35" fill="none" />
              <path d="M 100,155 L 100,190" stroke="#00d4ff" strokeWidth="0.8" opacity="0.4" fill="none" />
              <path d="M 112,155 L 112,185" stroke="#00d4ff" strokeWidth="0.8" opacity="0.35" fill="none" />

              {/* Neck horizontal connection */}
              <path d="M 85,175 L 115,175" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" fill="none" />
              <path d="M 82,185 L 118,185" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" fill="none" />

              {/* ===== SHOULDER HINTS (2 angled lines) ===== */}
              <path d="M 82,190 L 50,205" stroke="#00d4ff" strokeWidth="1" opacity="0.3" fill="none" />
              <path d="M 118,190 L 150,205" stroke="#00d4ff" strokeWidth="1" opacity="0.3" fill="none" />

              {/* ===== UNIFIED GAZE CONE from midpoint between eyes (cx=100, cy=78) ===== */}
              <polygon
                points={`100,78 ${100 + gazeX - 25},${78 + gazeY - 55} ${100 + gazeX + 25},${78 + gazeY - 55}`}
                fill="url(#rhp-gazeConeGradient)"
                opacity="0.4"
              />
              {/* Center gaze line */}
              <line
                x1="100"
                y1="78"
                x2={100 + gazeX}
                y2={78 + gazeY - 55}
                stroke={gazeOnRoad ? '#00e676' : '#ff6b35'}
                strokeWidth="1.5"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ===== STATUS INFO PANEL ===== */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 px-1 text-[9px] font-mono">
        <span className="text-slate-500">0-axis calibrated</span>
        <span className="text-slate-500">Road-facing neutral pose</span>
        <span className={gazeOnRoad ? 'text-dms-success' : 'text-dms-warning'}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
        <span className="text-dms-success">Head Pose Valid</span>
        <span className="text-slate-400">Tracking Locked</span>
        <span className="text-slate-400">
          Eye L: {eyesOpen ? 'OPEN' : 'CLOSED'} | Eye R: {eyesOpen ? 'OPEN' : 'CLOSED'}
        </span>
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
