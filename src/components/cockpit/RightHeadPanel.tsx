import React from 'react';
import { DMSTelemetry } from '../../types/dms';

interface RightHeadPanelProps {
  data: DMSTelemetry;
}

/**
 * Contour-based face visualization using layered isoparametric curves.
 * Each contour layer represents a depth level of the face topology,
 * similar to topographic elevation lines on a map.
 */

// ============================================================
// CONTOUR PATH DEFINITIONS
// ViewBox: 0 0 200 280
// Face is centered with padding for rotation headroom
// ============================================================

// Layer 0 (innermost/deepest - highest opacity) - Core facial ridge
const LAYER_0_PATHS: string[] = [
  // Nose bridge central ridge
  'M 100,62 C 98,68 97,74 96,80 C 95,86 95,92 96,96 C 97,100 100,104 100,104 C 100,104 103,100 104,96 C 105,92 105,86 104,80 C 103,74 102,68 100,62',
  // Upper lip cupid's bow
  'M 90,116 C 93,114 96,112 100,111 C 104,112 107,114 110,116',
  // Lower lip curve
  'M 92,120 C 95,123 98,124 100,124 C 102,124 105,123 108,120',
];

// Layer 1 - Inner face features (nose wings, eye sockets, mouth)
const LAYER_1_PATHS: string[] = [
  // Left eye socket inner
  'M 76,72 C 78,68 82,66 86,67 C 90,68 93,71 93,75 C 93,79 90,82 86,83 C 82,83 78,81 76,78 C 75,76 75,74 76,72',
  // Right eye socket inner
  'M 124,72 C 122,68 118,66 114,67 C 110,68 107,71 107,75 C 107,79 110,82 114,83 C 118,83 122,81 124,78 C 125,76 125,74 124,72',
  // Left nostril contour
  'M 92,98 C 90,100 88,102 88,104 C 88,106 90,108 93,108 C 95,108 96,106 96,104',
  // Right nostril contour
  'M 108,98 C 110,100 112,102 112,104 C 112,106 110,108 107,108 C 105,108 104,106 104,104',
  // Mouth opening contour
  'M 88,116 C 91,118 95,119 100,119 C 105,119 109,118 112,116 C 109,120 105,121 100,121 C 95,121 91,120 88,116',
];

// Layer 2 - Mid face structure (brow, cheekbones, chin)
const LAYER_2_PATHS: string[] = [
  // Left eyebrow arch
  'M 70,62 C 74,58 79,56 84,57 C 89,58 93,60 95,63',
  // Right eyebrow arch
  'M 130,62 C 126,58 121,56 116,57 C 111,58 107,60 105,63',
  // Left cheekbone contour
  'M 68,86 C 66,92 66,98 68,104 C 70,108 74,112 78,114',
  // Right cheekbone contour
  'M 132,86 C 134,92 134,98 132,104 C 130,108 126,112 122,114',
  // Chin contour
  'M 86,136 C 90,142 95,145 100,146 C 105,145 110,142 114,136',
  // Forehead lower ridge
  'M 76,58 C 82,54 90,52 100,52 C 110,52 118,54 124,58',
];

// Layer 3 - Face outline inner
const LAYER_3_PATHS: string[] = [
  // Left face side
  'M 72,50 C 64,58 60,68 58,80 C 56,92 58,104 62,114 C 66,124 72,132 80,138',
  // Right face side
  'M 128,50 C 136,58 140,68 142,80 C 144,92 142,104 138,114 C 134,124 128,132 120,138',
  // Forehead upper curve
  'M 72,50 C 78,44 88,40 100,40 C 112,40 122,44 128,50',
  // Jaw lower merge
  'M 80,138 C 86,144 92,148 100,150 C 108,148 114,144 120,138',
  // Neck top
  'M 88,152 C 92,156 96,158 100,158 C 104,158 108,156 112,152',
];

// Layer 4 - Outer face boundary
const LAYER_4_PATHS: string[] = [
  // Left outer contour
  'M 68,44 C 58,54 52,66 50,82 C 48,98 52,112 58,124 C 64,134 72,142 82,148',
  // Right outer contour
  'M 132,44 C 142,54 148,66 150,82 C 152,98 148,112 142,124 C 136,134 128,142 118,148',
  // Top head curve
  'M 68,44 C 76,36 86,32 100,32 C 114,32 124,36 132,44',
  // Lower chin/neck transition
  'M 82,148 C 88,154 94,158 100,160 C 106,158 112,154 118,148',
];

// Layer 5 - Head silhouette (outermost)
const LAYER_5_PATHS: string[] = [
  // Full head outline left
  'M 64,38 C 52,50 46,66 44,84 C 42,102 46,118 54,132 C 62,144 72,152 84,158',
  // Full head outline right
  'M 136,38 C 148,50 154,66 156,84 C 158,102 154,118 146,132 C 138,144 128,152 116,158',
  // Cranium top
  'M 64,38 C 72,28 84,24 100,24 C 116,24 128,28 136,38',
  // Neck/shoulder base
  'M 84,158 C 86,164 88,170 86,178 C 84,184 78,190 70,196',
  'M 116,158 C 114,164 112,170 114,178 C 116,184 122,190 130,196',
  // Shoulder hints
  'M 70,196 C 62,200 54,204 46,206',
  'M 130,196 C 138,200 146,204 154,206',
];

// Layer 6 - Very faint outer aura
const LAYER_6_PATHS: string[] = [
  // Outermost head shape left
  'M 60,34 C 46,48 40,66 38,86 C 36,106 40,124 50,138 C 58,150 68,160 80,166',
  // Outermost head shape right
  'M 140,34 C 154,48 160,66 162,86 C 164,106 160,124 150,138 C 142,150 132,160 120,166',
  // Outermost top
  'M 60,34 C 70,24 84,18 100,18 C 116,18 130,24 140,34',
];

// Feature detail paths (eyes, ears, nose detail)
const FEATURE_DETAIL_PATHS: string[] = [
  // Left eyelid upper
  'M 76,72 C 79,70 83,69 86,70 C 89,71 91,73 92,75',
  // Left eyelid lower
  'M 76,78 C 79,80 83,81 86,80 C 89,79 91,77 92,75',
  // Right eyelid upper
  'M 124,72 C 121,70 117,69 114,70 C 111,71 109,73 108,75',
  // Right eyelid lower
  'M 124,78 C 121,80 117,81 114,80 C 111,79 109,77 108,75',
  // Left ear hint
  'M 54,72 C 50,76 48,82 49,88 C 50,94 52,98 55,100',
  // Right ear hint
  'M 146,72 C 150,76 152,82 151,88 C 150,94 148,98 145,100',
  // Nose tip contour
  'M 93,104 C 95,106 97,108 100,108 C 103,108 105,106 107,104',
  // Philtrum lines
  'M 97,108 L 97,112',
  'M 103,108 L 103,112',
];

// Subtle wireframe overlay connecting key landmark points
const WIREFRAME_CONNECTIONS: Array<[number, number, number, number]> = [
  // Forehead cross-links
  [74, 56, 100, 48],
  [126, 56, 100, 48],
  [74, 56, 86, 67],
  [126, 56, 114, 67],
  // Eye-to-nose connections
  [86, 75, 96, 88],
  [114, 75, 104, 88],
  // Nose to mouth
  [100, 108, 100, 111],
  // Mouth corners to jaw
  [88, 116, 78, 132],
  [112, 116, 122, 132],
  // Chin structure
  [100, 124, 100, 146],
  [86, 136, 100, 146],
  [114, 136, 100, 146],
  // Eye bridge
  [86, 75, 100, 72],
  [114, 75, 100, 72],
];

// Key landmark positions (for glow dots)
const LANDMARKS = {
  leftEye: { cx: 84, cy: 75 },
  rightEye: { cx: 116, cy: 75 },
  noseTip: { cx: 100, cy: 106 },
  chin: { cx: 100, cy: 146 },
};

// Layer styling configuration
const LAYER_STYLES = [
  { color: '#00d4ff', opacity: 0.50, width: 1.0 },   // Layer 0 - innermost/brightest
  { color: '#00d4ff', opacity: 0.42, width: 0.9 },   // Layer 1
  { color: '#00d4ff', opacity: 0.35, width: 0.8 },   // Layer 2
  { color: '#00d4ff', opacity: 0.28, width: 0.7 },   // Layer 3
  { color: '#6366f1', opacity: 0.22, width: 0.6 },   // Layer 4 - purple edges
  { color: '#6366f1', opacity: 0.18, width: 0.5 },   // Layer 5
  { color: '#6366f1', opacity: 0.12, width: 0.4 },   // Layer 6 - outermost/dimmest
];

const ALL_LAYERS: string[][] = [
  LAYER_0_PATHS,
  LAYER_1_PATHS,
  LAYER_2_PATHS,
  LAYER_3_PATHS,
  LAYER_4_PATHS,
  LAYER_5_PATHS,
  LAYER_6_PATHS,
];

export const RightHeadPanel: React.FC<RightHeadPanelProps> = ({ data }) => {
  const { yaw, pitch, roll } = data.headPose;
  const gazeOnRoad = data.gaze.onRoad;

  // Clamp rotation to +-35 degrees for visual stability and readability
  const clamp35 = (v: number) => Math.max(-35, Math.min(35, v));
  const clampedYaw = clamp35(yaw);
  const clampedPitch = clamp35(pitch);
  const clampedRoll = clamp35(roll);

  // Gaze direction for cone visualization
  // gazeX/gazeY represent the raw offset from center (0 = looking straight ahead)
  // In SVG coordinates, Y-down means default forward gaze (0.5, 0.5) points upward (-Y)
  const gazeOffsetX = (data.gaze.x - 0.5) * 70;
  const gazeOffsetY = (data.gaze.y - 0.5) * 50;

  // Eye openness from confidence
  const eyesVisible = data.confidence.eyesVisible;

  // Panel border glow based on road gaze
  const borderGlow = gazeOnRoad
    ? '0 0 12px rgba(0, 212, 255, 0.3), inset 0 0 4px rgba(0, 212, 255, 0.05)'
    : '0 0 12px rgba(255, 107, 53, 0.3), inset 0 0 4px rgba(255, 107, 53, 0.05)';

  // Midpoint between both eyes for gaze cone origin
  const gazeMidX = (LANDMARKS.leftEye.cx + LANDMARKS.rightEye.cx) / 2;
  const gazeMidY = (LANDMARKS.leftEye.cy + LANDMARKS.rightEye.cy) / 2;

  // Compute gaze cone direction vector with fixed length of 50 units.
  // Default gaze (0.5, 0.5) means looking forward/at road, rendered as pointing up (-Y in SVG).
  // Off-center gaze rotates the cone in that direction.
  const coneLength = 50;
  const coneHalfWidth = 18; // 36 units total width at tip
  // Compute direction from an upward-biased reference point.
  // gazeOffsetX ranges [-35, 35], gazeOffsetY ranges [-25, 25].
  // forwardRef defines the upward bias: when gazeOffsetY < forwardRef, cone points up;
  // when gazeOffsetY > forwardRef, cone tilts down. Using 20 ensures that
  // moderate downward gaze (phone use at ~0.9) starts tilting the cone down.
  const forwardRef = 20;
  const dirX = gazeOffsetX;
  const dirY = gazeOffsetY - forwardRef;
  const dirMag = Math.sqrt(dirX * dirX + dirY * dirY);
  // When direction magnitude is too small (near-degenerate), default to straight up
  const effectiveDirX = dirMag > 1 ? dirX / dirMag : 0;
  const effectiveDirY = dirMag > 1 ? dirY / dirMag : -1;
  // Scale normalized direction to fixed cone length
  const normDirX = effectiveDirX * coneLength;
  const normDirY = effectiveDirY * coneLength;
  // Perpendicular vector for cone spread (rotated 90 degrees from direction)
  const perpX = -effectiveDirY * coneHalfWidth;
  const perpY = effectiveDirX * coneHalfWidth;
  // Cone tip endpoints (two corners of the triangle at the tip)
  const coneTipCenterX = gazeMidX + normDirX;
  const coneTipCenterY = gazeMidY + normDirY;
  const coneTipLeftX = coneTipCenterX - perpX;
  const coneTipLeftY = coneTipCenterY - perpY;
  const coneTipRightX = coneTipCenterX + perpX;
  const coneTipRightY = coneTipCenterY + perpY;

  const gazeColor = gazeOnRoad ? '#00e676' : '#ff6b35';

  return (
    <div
      className={`bg-dms-panel rounded-lg border p-2 flex flex-col h-full overflow-visible ${
        gazeOnRoad ? 'border-dms-accent/30' : 'border-dms-warning/30'
      }`}
      style={{ boxShadow: borderGlow }}
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
            perspective: '800px',
            perspectiveOrigin: '50% 45%',
          }}
        >
          {/* 0-axis reference lines (stationary, behind the rotating head) */}
          <svg
            className="absolute pointer-events-none"
            style={{ width: '100%', height: '100%', maxWidth: '260px', maxHeight: '300px' }}
            viewBox="0 0 200 280"
            preserveAspectRatio="xMidYMid meet"
          >
            <line x1="100" y1="10" x2="100" y2="270" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="10" y1="120" x2="190" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
          </svg>

          {/* Rotatable head - contour visualization */}
          <div
            className="overflow-visible"
            style={{
              transform: `rotateY(${clampedYaw}deg) rotateX(${-clampedPitch}deg) rotateZ(${clampedRoll}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out',
              transformOrigin: 'center center',
              width: '100%',
              maxWidth: '220px',
              aspectRatio: '200 / 280',
            }}
          >
            <svg
              viewBox="0 0 200 280"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full overflow-visible"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Radial depth gradient for subtle fill */}
                <radialGradient id="rhp-depthFill" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.04" />
                  <stop offset="60%" stopColor="#00d4ff" stopOpacity="0.015" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.005" />
                </radialGradient>
                {/* Eye glow */}
                <radialGradient id="rhp-eyeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00ffcc" stopOpacity="1" />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
                {/* Landmark glow */}
                <radialGradient id="rhp-landmarkGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
                {/* Gaze cone gradient */}
                <linearGradient id="rhp-gazeConeGrad" gradientUnits="userSpaceOnUse" x1={String(gazeMidX)} y1={String(gazeMidY)} x2={String(coneTipCenterX)} y2={String(coneTipCenterY)}>
                  <stop offset="0%" stopColor={gazeColor} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={gazeColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Subtle overall face shape fill for depth perception */}
              <ellipse
                cx="100"
                cy="100"
                rx="52"
                ry="66"
                fill="url(#rhp-depthFill)"
              />

              {/* ===== CONTOUR LAYERS (bottom to top / outer to inner) ===== */}
              {ALL_LAYERS.slice().reverse().map((layerPaths, reverseIdx) => {
                const layerIdx = ALL_LAYERS.length - 1 - reverseIdx;
                const style = LAYER_STYLES[layerIdx];
                return (
                  <g key={`layer-${layerIdx}`}>
                    {layerPaths.map((d, pathIdx) => (
                      <path
                        key={`l${layerIdx}-p${pathIdx}`}
                        d={d}
                        fill="none"
                        stroke={style.color}
                        strokeWidth={style.width}
                        strokeOpacity={style.opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </g>
                );
              })}

              {/* ===== FEATURE DETAIL CONTOURS ===== */}
              <g>
                {FEATURE_DETAIL_PATHS.map((d, i) => (
                  <path
                    key={`detail-${i}`}
                    d={d}
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth={0.7}
                    strokeOpacity={0.38}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>

              {/* ===== SUBTLE WIREFRAME OVERLAY ===== */}
              <g opacity="0.15">
                {WIREFRAME_CONNECTIONS.map(([x1, y1, x2, y2], i) => (
                  <line
                    key={`wire-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#00d4ff"
                    strokeWidth={0.3}
                    strokeDasharray="2,2"
                  />
                ))}
              </g>

              {/* ===== LANDMARK GLOW DOTS ===== */}
              {/* Nose tip */}
              <circle cx={LANDMARKS.noseTip.cx} cy={LANDMARKS.noseTip.cy} r="3" fill="url(#rhp-landmarkGlow)" />
              <circle cx={LANDMARKS.noseTip.cx} cy={LANDMARKS.noseTip.cy} r="1.2" fill="#00d4ff" opacity="0.8" />

              {/* Chin */}
              <circle cx={LANDMARKS.chin.cx} cy={LANDMARKS.chin.cy} r="2.5" fill="url(#rhp-landmarkGlow)" opacity="0.6" />
              <circle cx={LANDMARKS.chin.cx} cy={LANDMARKS.chin.cy} r="1" fill="#00d4ff" opacity="0.6" />

              {/* ===== EYE GLOW INDICATORS ===== */}
              {/* Left eye */}
              <circle cx={LANDMARKS.leftEye.cx} cy={LANDMARKS.leftEye.cy} r="5" fill="url(#rhp-eyeGlow)" opacity={eyesVisible ? 0.9 : 0.3}>
                <animate attributeName="r" values="4;5.5;4" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values={eyesVisible ? '0.7;1;0.7' : '0.2;0.35;0.2'} dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={LANDMARKS.leftEye.cx} cy={LANDMARKS.leftEye.cy} r="1.8" fill="#00ffcc" opacity={eyesVisible ? 0.9 : 0.3} />

              {/* Right eye */}
              <circle cx={LANDMARKS.rightEye.cx} cy={LANDMARKS.rightEye.cy} r="5" fill="url(#rhp-eyeGlow)" opacity={eyesVisible ? 0.9 : 0.3}>
                <animate attributeName="r" values="4;5.5;4" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values={eyesVisible ? '0.7;1;0.7' : '0.2;0.35;0.2'} dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={LANDMARKS.rightEye.cx} cy={LANDMARKS.rightEye.cy} r="1.8" fill="#00ffcc" opacity={eyesVisible ? 0.9 : 0.3} />

              {/* Eye bridge connection (gaze origin marker) */}
              <line
                x1={LANDMARKS.leftEye.cx}
                y1={LANDMARKS.leftEye.cy}
                x2={LANDMARKS.rightEye.cx}
                y2={LANDMARKS.rightEye.cy}
                stroke="#00d4ff"
                strokeWidth="0.5"
                strokeOpacity="0.25"
                strokeDasharray="1.5,1.5"
              />

              {/* ===== UNIFIED GAZE CONE ===== */}
              <polygon
                points={`${gazeMidX},${gazeMidY} ${coneTipLeftX},${coneTipLeftY} ${coneTipRightX},${coneTipRightY}`}
                fill="url(#rhp-gazeConeGrad)"
                opacity="0.4"
              />
              {/* Gaze center line */}
              <line
                x1={gazeMidX}
                y1={gazeMidY}
                x2={coneTipCenterX}
                y2={coneTipCenterY}
                stroke={gazeColor}
                strokeWidth="1"
                opacity="0.6"
                strokeLinecap="round"
              />
              {/* Gaze origin dot */}
              <circle
                cx={gazeMidX}
                cy={gazeMidY}
                r="1.5"
                fill={gazeColor}
                opacity="0.75"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ===== STATUS INFO PANEL ===== */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 px-1 text-[9px] font-mono">
        <span className={gazeOnRoad ? 'text-dms-success' : 'text-dms-warning'}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
        <span className="text-slate-500">0-axis calibrated</span>
        <span className="text-slate-500">Road-facing neutral</span>
        <span className={data.confidence.faceDetected ? 'text-dms-success' : 'text-dms-danger'}>
          {data.confidence.faceDetected ? 'Head Pose Valid' : 'Head Pose Lost'}
        </span>
        <span className={data.confidence.faceDetected ? 'text-dms-success' : 'text-dms-danger'}>
          {data.confidence.faceDetected ? 'Tracking Locked' : 'Tracking Lost'}
        </span>
        <span className="text-slate-400">
          Eye L: {eyesVisible ? 'OPEN' : 'SHUT'} | R: {eyesVisible ? 'OPEN' : 'SHUT'}
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
