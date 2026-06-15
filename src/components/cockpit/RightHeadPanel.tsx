import React from 'react';
import { DMSTelemetry } from '../../types/dms';

interface RightHeadPanelProps {
  data: DMSTelemetry;
}

// Triangle definition: [x1, y1, x2, y2, x3, y3, depthZone]
// depthZone: 0=front-center (brightest), 1=mid, 2=edge (dimmest)
type Triangle = [number, number, number, number, number, number, number];

// Production-grade 3D face mesh vertices (MediaPipe FaceMesh inspired)
// Coordinates in viewBox 0 0 200 240
const FACE_MESH_TRIANGLES: Triangle[] = [
  // === FOREHEAD (upper region - curved surface) ===
  // Top forehead center
  [100, 22, 88, 28, 112, 28, 0],
  [88, 28, 78, 35, 100, 30, 0],
  [112, 28, 122, 35, 100, 30, 0],
  [78, 35, 68, 42, 88, 38, 1],
  [122, 35, 132, 42, 112, 38, 1],
  [88, 28, 88, 38, 78, 35, 1],
  [112, 28, 112, 38, 122, 35, 1],
  // Mid forehead
  [88, 38, 100, 36, 100, 44, 0],
  [112, 38, 100, 36, 100, 44, 0],
  [68, 42, 60, 50, 78, 48, 2],
  [132, 42, 140, 50, 122, 48, 2],
  [78, 48, 88, 38, 68, 42, 1],
  [122, 48, 112, 38, 132, 42, 1],
  [88, 38, 78, 48, 92, 48, 1],
  [112, 38, 122, 48, 108, 48, 1],
  // Lower forehead
  [92, 48, 100, 44, 108, 48, 0],
  [78, 48, 72, 56, 88, 54, 1],
  [122, 48, 128, 56, 112, 54, 1],
  [92, 48, 88, 54, 100, 52, 0],
  [108, 48, 112, 54, 100, 52, 0],

  // === TEMPLE REGIONS (sides - depth zone 2) ===
  [60, 50, 54, 60, 68, 58, 2],
  [140, 50, 146, 60, 132, 58, 2],
  [54, 60, 52, 72, 62, 66, 2],
  [146, 60, 148, 72, 138, 66, 2],

  // === BROW RIDGE ===
  [72, 56, 64, 62, 78, 62, 1],
  [128, 56, 136, 62, 122, 62, 1],
  [78, 62, 88, 54, 88, 62, 0],
  [122, 62, 112, 54, 112, 62, 0],
  [88, 62, 100, 58, 96, 64, 0],
  [112, 62, 100, 58, 104, 64, 0],

  // === LEFT EYE SOCKET (dense triangulation) ===
  [66, 66, 72, 62, 74, 70, 1],
  [74, 70, 72, 62, 82, 66, 0],
  [82, 66, 88, 62, 86, 70, 0],
  [86, 70, 92, 66, 88, 62, 0],
  [66, 66, 74, 70, 68, 76, 2],
  [74, 70, 82, 74, 68, 76, 1],
  [82, 66, 86, 70, 82, 74, 0],
  [86, 70, 92, 74, 82, 74, 0],
  [92, 66, 96, 72, 92, 74, 0],
  [68, 76, 82, 74, 70, 82, 1],
  [82, 74, 92, 74, 86, 80, 0],
  [70, 82, 82, 74, 76, 82, 1],
  [76, 82, 86, 80, 82, 74, 0],
  [86, 80, 92, 74, 92, 80, 0],
  [70, 82, 76, 82, 72, 88, 1],
  [76, 82, 86, 80, 82, 86, 0],
  [86, 80, 92, 80, 90, 86, 0],
  [72, 88, 76, 82, 82, 86, 1],
  [72, 88, 82, 86, 78, 92, 1],
  [82, 86, 90, 86, 86, 92, 0],

  // === RIGHT EYE SOCKET (dense triangulation - mirror) ===
  [134, 66, 128, 62, 126, 70, 1],
  [126, 70, 128, 62, 118, 66, 0],
  [118, 66, 112, 62, 114, 70, 0],
  [114, 70, 108, 66, 112, 62, 0],
  [134, 66, 126, 70, 132, 76, 2],
  [126, 70, 118, 74, 132, 76, 1],
  [118, 66, 114, 70, 118, 74, 0],
  [114, 70, 108, 74, 118, 74, 0],
  [108, 66, 104, 72, 108, 74, 0],
  [132, 76, 118, 74, 130, 82, 1],
  [118, 74, 108, 74, 114, 80, 0],
  [130, 82, 118, 74, 124, 82, 1],
  [124, 82, 114, 80, 118, 74, 0],
  [114, 80, 108, 74, 108, 80, 0],
  [130, 82, 124, 82, 128, 88, 1],
  [124, 82, 114, 80, 118, 86, 0],
  [114, 80, 108, 80, 110, 86, 0],
  [128, 88, 124, 82, 118, 86, 1],
  [128, 88, 118, 86, 122, 92, 1],
  [118, 86, 110, 86, 114, 92, 0],

  // === NOSE BRIDGE (triangulated - front facing) ===
  [96, 64, 100, 58, 104, 64, 0],
  [96, 64, 100, 70, 92, 72, 0],
  [104, 64, 100, 70, 108, 72, 0],
  [100, 70, 96, 78, 92, 72, 0],
  [100, 70, 104, 78, 108, 72, 0],
  [96, 78, 100, 82, 92, 80, 0],
  [104, 78, 100, 82, 108, 80, 0],
  [92, 80, 100, 82, 94, 88, 0],
  [108, 80, 100, 82, 106, 88, 0],

  // === NOSE TIP & WINGS ===
  [94, 88, 100, 82, 100, 92, 0],
  [106, 88, 100, 82, 100, 92, 0],
  [94, 88, 100, 92, 90, 96, 0],
  [106, 88, 100, 92, 110, 96, 0],
  [90, 96, 100, 92, 96, 100, 0],
  [110, 96, 100, 92, 104, 100, 0],
  [96, 100, 100, 98, 104, 100, 0],
  [90, 96, 86, 94, 84, 100, 1],
  [110, 96, 114, 94, 116, 100, 1],

  // === CHEEKS (mid-face sides) ===
  [62, 66, 52, 72, 58, 80, 2],
  [138, 66, 148, 72, 142, 80, 2],
  [58, 80, 52, 72, 54, 88, 2],
  [142, 80, 148, 72, 146, 88, 2],
  [66, 66, 62, 66, 68, 76, 2],
  [134, 66, 138, 66, 132, 76, 2],
  [58, 80, 54, 88, 66, 90, 2],
  [142, 80, 146, 88, 134, 90, 2],
  [68, 76, 70, 82, 64, 86, 2],
  [132, 76, 130, 82, 136, 86, 2],
  [64, 86, 70, 82, 66, 90, 2],
  [136, 86, 130, 82, 134, 90, 2],
  [66, 90, 72, 88, 70, 96, 1],
  [134, 90, 128, 88, 130, 96, 1],
  [70, 96, 78, 92, 76, 100, 1],
  [130, 96, 122, 92, 124, 100, 1],
  [54, 88, 56, 98, 66, 96, 2],
  [146, 88, 144, 98, 134, 96, 2],
  [66, 90, 66, 96, 56, 98, 2],
  [134, 90, 134, 96, 144, 98, 2],

  // === NASOLABIAL / UPPER LIP AREA ===
  [84, 100, 90, 96, 86, 106, 1],
  [116, 100, 110, 96, 114, 106, 1],
  [86, 106, 96, 100, 94, 108, 0],
  [114, 106, 104, 100, 106, 108, 0],
  [94, 108, 100, 104, 106, 108, 0],
  [86, 106, 94, 108, 88, 112, 0],
  [114, 106, 106, 108, 112, 112, 0],

  // === MOUTH REGION (dense) ===
  [88, 112, 94, 108, 96, 114, 0],
  [112, 112, 106, 108, 104, 114, 0],
  [96, 114, 100, 110, 104, 114, 0],
  [88, 112, 96, 114, 92, 118, 0],
  [112, 112, 104, 114, 108, 118, 0],
  [92, 118, 96, 114, 100, 116, 0],
  [108, 118, 104, 114, 100, 116, 0],
  [92, 118, 100, 116, 100, 120, 0],
  [108, 118, 100, 116, 100, 120, 0],
  [92, 118, 100, 120, 94, 124, 0],
  [108, 118, 100, 120, 106, 124, 0],
  [94, 124, 100, 122, 106, 124, 0],
  [88, 112, 82, 116, 86, 120, 1],
  [112, 112, 118, 116, 114, 120, 1],
  [86, 120, 92, 118, 88, 124, 0],
  [114, 120, 108, 118, 112, 124, 0],

  // === LOWER LIP / CHIN UPPER ===
  [88, 124, 94, 124, 92, 130, 0],
  [112, 124, 106, 124, 108, 130, 0],
  [92, 130, 100, 126, 108, 130, 0],
  [92, 130, 100, 132, 108, 130, 0],
  [82, 116, 76, 100, 70, 110, 2],
  [118, 116, 124, 100, 130, 110, 2],
  [82, 116, 70, 110, 74, 122, 2],
  [118, 116, 130, 110, 126, 122, 2],

  // === JAWLINE (triangulated contour) ===
  [56, 98, 54, 108, 64, 104, 2],
  [144, 98, 146, 108, 136, 104, 2],
  [64, 104, 54, 108, 58, 118, 2],
  [136, 104, 146, 108, 142, 118, 2],
  [64, 104, 58, 118, 68, 116, 2],
  [136, 104, 142, 118, 132, 116, 2],
  [68, 116, 58, 118, 64, 128, 2],
  [132, 116, 142, 118, 136, 128, 2],
  [68, 116, 64, 128, 74, 128, 2],
  [132, 116, 136, 128, 126, 128, 2],
  [74, 128, 64, 128, 70, 136, 2],
  [126, 128, 136, 128, 130, 136, 2],
  [74, 128, 70, 136, 80, 136, 1],
  [126, 128, 130, 136, 120, 136, 1],
  [80, 136, 70, 136, 78, 144, 1],
  [120, 136, 130, 136, 122, 144, 1],
  [80, 136, 78, 144, 88, 142, 1],
  [120, 136, 122, 144, 112, 142, 1],

  // === CHIN ===
  [88, 142, 78, 144, 84, 150, 1],
  [112, 142, 122, 144, 116, 150, 1],
  [88, 142, 84, 150, 92, 148, 0],
  [112, 142, 116, 150, 108, 148, 0],
  [92, 148, 100, 146, 108, 148, 0],
  [84, 150, 92, 148, 88, 154, 1],
  [116, 150, 108, 148, 112, 154, 1],
  [88, 154, 92, 148, 100, 152, 0],
  [112, 154, 108, 148, 100, 152, 0],
  [88, 154, 100, 152, 100, 158, 1],
  [112, 154, 100, 152, 100, 158, 1],

  // === UNDER CHIN / JAW SIDES ===
  [74, 122, 70, 110, 66, 120, 2],
  [126, 122, 130, 110, 134, 120, 2],
  [66, 120, 68, 116, 74, 122, 2],
  [134, 120, 132, 116, 126, 122, 2],
  [74, 122, 74, 128, 82, 116, 2],
  [126, 122, 126, 128, 118, 116, 2],
  [82, 116, 86, 120, 74, 128, 1],
  [118, 116, 114, 120, 126, 128, 1],

  // === NECK ===
  [88, 154, 100, 158, 92, 168, 1],
  [112, 154, 100, 158, 108, 168, 1],
  [92, 168, 100, 158, 100, 172, 0],
  [108, 168, 100, 158, 100, 172, 0],
  [92, 168, 100, 172, 94, 180, 1],
  [108, 168, 100, 172, 106, 180, 1],
  [94, 180, 100, 172, 100, 184, 0],
  [106, 180, 100, 172, 100, 184, 0],
  [88, 154, 92, 168, 82, 168, 2],
  [112, 154, 108, 168, 118, 168, 2],
  [82, 168, 92, 168, 86, 180, 2],
  [118, 168, 108, 168, 114, 180, 2],
  [86, 180, 94, 180, 88, 190, 2],
  [114, 180, 106, 180, 112, 190, 2],
  [88, 190, 94, 180, 100, 184, 1],
  [112, 190, 106, 180, 100, 184, 1],
  [88, 190, 100, 184, 100, 194, 1],
  [112, 190, 100, 184, 100, 194, 1],

  // === SHOULDERS ===
  [82, 168, 86, 180, 72, 186, 2],
  [118, 168, 114, 180, 128, 186, 2],
  [72, 186, 86, 180, 78, 194, 2],
  [128, 186, 114, 180, 122, 194, 2],
  [78, 194, 88, 190, 86, 180, 2],
  [122, 194, 112, 190, 114, 180, 2],
  [72, 186, 60, 198, 78, 194, 2],
  [128, 186, 140, 198, 122, 194, 2],
  [60, 198, 78, 194, 70, 206, 2],
  [140, 198, 122, 194, 130, 206, 2],
];

// Get stroke color and opacity based on depth zone
function getTriangleStyle(zone: number): { stroke: string; strokeOpacity: number; fillOpacity: number } {
  switch (zone) {
    case 0: // Front-center (brightest)
      return { stroke: '#00d4ff', strokeOpacity: 0.55, fillOpacity: 0.04 };
    case 1: // Mid
      return { stroke: '#00d4ff', strokeOpacity: 0.32, fillOpacity: 0.025 };
    case 2: // Edge (dimmest, with purple tint)
      return { stroke: '#6366f1', strokeOpacity: 0.22, fillOpacity: 0.02 };
    default:
      return { stroke: '#00d4ff', strokeOpacity: 0.3, fillOpacity: 0.02 };
  }
}

export const RightHeadPanel: React.FC<RightHeadPanelProps> = ({ data }) => {
  const { yaw, pitch, roll } = data.headPose;
  const gazeOnRoad = data.gaze.onRoad;

  // Clamp CSS rotation to +-40 degrees for visual stability
  const clampedYaw = Math.max(-40, Math.min(40, yaw));
  const clampedPitch = Math.max(-40, Math.min(40, pitch));
  const clampedRoll = Math.max(-40, Math.min(40, roll));

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
      className={`bg-dms-panel rounded-lg border p-2 flex flex-col h-full overflow-visible ${
        gazeOnRoad ? 'border-dms-accent/30' : 'border-dms-warning/30'
      }`}
      style={panelBorderStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3D Head Model</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          gazeOnRoad ? 'text-dms-success bg-dms-success/10' : 'text-dms-warning bg-dms-warning/10'
        }`}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
      </div>

      {/* 3D Head Visualization */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 overflow-visible"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.03) 0%, transparent 70%)',
        }}
      >
        {/* Perspective container */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-visible"
          style={{
            perspective: '600px',
            perspectiveOrigin: '50% 45%',
          }}
        >
          {/* 0-axis reference lines (stationary, behind the rotating head) */}
          <svg
            className="absolute pointer-events-none"
            style={{ width: '100%', height: '100%', maxWidth: '260px', maxHeight: '260px' }}
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Vertical center line */}
            <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="3,3" />
            {/* Horizontal center line */}
            <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="3,3" />
            {/* Axis labels */}
            <text x="186" y="96" textAnchor="end" fill="#475569" fontSize="7" fontFamily="monospace">YAW</text>
            <text x="100" y="8" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">PITCH</text>
          </svg>

          {/* Rotatable head mesh */}
          <div
            className="overflow-visible"
            style={{
              transform: `rotateY(${clampedYaw}deg) rotateX(${-clampedPitch}deg) rotateZ(${clampedRoll}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out',
              width: '100%',
              maxWidth: '240px',
              aspectRatio: '200 / 240',
            }}
          >
            <svg
              viewBox="0 0 200 240"
              className="w-full h-full overflow-visible"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Eye glow gradients */}
                <radialGradient id="rhp3d-eyeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00ffcc" stopOpacity="1" />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
                {/* Gaze cone gradient */}
                <linearGradient id="rhp3d-gazeCone" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={gazeOnRoad ? '#00e676' : '#ff6b35'} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={gazeOnRoad ? '#00e676' : '#ff6b35'} stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {/* ===== TRIANGULATED FACE MESH ===== */}
              {FACE_MESH_TRIANGLES.map((tri, i) => {
                const [x1, y1, x2, y2, x3, y3, zone] = tri;
                const style = getTriangleStyle(zone);
                return (
                  <polygon
                    key={i}
                    points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                    fill={style.stroke}
                    fillOpacity={style.fillOpacity}
                    stroke={style.stroke}
                    strokeWidth={zone === 0 ? 0.5 : zone === 1 ? 0.4 : 0.3}
                    strokeOpacity={style.strokeOpacity}
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* ===== EYE GLOW POINTS (pulsing) ===== */}
              {/* Left eye */}
              <circle cx="80" cy="78" r="4" fill="url(#rhp3d-eyeGlow)" opacity="0.9">
                <animate attributeName="r" values="3.5;5;3.5" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="78" r="2" fill="#00ffcc" opacity="0.95" />

              {/* Right eye */}
              <circle cx="120" cy="78" r="4" fill="url(#rhp3d-eyeGlow)" opacity="0.9">
                <animate attributeName="r" values="3.5;5;3.5" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="120" cy="78" r="2" fill="#00ffcc" opacity="0.95" />

              {/* ===== UNIFIED GAZE CONE from midpoint between eyes (cx=100, cy=78) ===== */}
              <polygon
                points={`100,78 ${100 + gazeX - 22},${78 + gazeY - 50} ${100 + gazeX + 22},${78 + gazeY - 50}`}
                fill="url(#rhp3d-gazeCone)"
                opacity="0.45"
              />
              {/* Gaze center line */}
              <line
                x1="100"
                y1="78"
                x2={100 + gazeX}
                y2={78 + gazeY - 50}
                stroke={gazeOnRoad ? '#00e676' : '#ff6b35'}
                strokeWidth="1.2"
                opacity="0.65"
                strokeLinecap="round"
              />
              {/* Gaze origin dot */}
              <circle
                cx="100"
                cy="78"
                r="1.5"
                fill={gazeOnRoad ? '#00e676' : '#ff6b35'}
                opacity="0.8"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ===== STATUS INFO PANEL ===== */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 px-1 text-[9px] font-mono">
        <span className="text-slate-500">0-axis calibrated</span>
        <span className="text-slate-500">Road-facing neutral</span>
        <span className={gazeOnRoad ? 'text-dms-success' : 'text-dms-warning'}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
        <span className={data.confidence.faceDetected ? 'text-dms-success' : 'text-dms-danger'}>
          {data.confidence.faceDetected ? 'Head Pose Valid' : 'Head Pose Lost'}
        </span>
        <span className={data.confidence.faceDetected ? 'text-dms-success' : 'text-dms-danger'}>
          {data.confidence.faceDetected ? 'Tracking Locked' : 'Tracking Lost'}
        </span>
        <span className="text-slate-400">
          Eye L: {eyesOpen ? 'OPEN' : 'SHUT'} | R: {eyesOpen ? 'OPEN' : 'SHUT'}
        </span>
      </div>

      {/* Yaw/Pitch/Roll Values */}
      <div className="grid grid-cols-3 gap-2 mt-1 pt-1 border-t border-slate-700/50">
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
