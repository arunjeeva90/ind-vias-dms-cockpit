import React from 'react';
import { DMSTelemetry } from '../../types/dms';
import { mapDriverState, getStateLabel, getStateColor } from '../../utils/driverStateMapping';

interface CenterVideoPanelProps {
  data: DMSTelemetry;
}

function getGazeLabel(data: DMSTelemetry): string {
  if (data.gaze.onRoad) return 'Front Windshield';
  if (data.gaze.x < 0.3) return 'Left Mirror';
  if (data.gaze.x > 0.7) return 'Right Mirror';
  if (data.gaze.y > 0.7) return 'Instrument Panel';
  return 'Off Road';
}

function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour12: false });
}

export const CenterVideoPanel: React.FC<CenterVideoPanelProps> = ({ data }) => {
  const gazeLabel = getGazeLabel(data);
  const overallState = mapDriverState(data.driverState, data.confidence.overall);
  const stateLabel = getStateLabel(overallState);
  const stateColorClass = getStateColor(overallState);

  // Head pose affects bounding box position slightly
  const boxOffsetX = data.headPose.yaw * 0.3;
  const boxOffsetY = data.headPose.pitch * 0.3;

  // Gaze arrow direction - longer arrow with 1.5x multiplier
  const gazeAngleX = (data.gaze.x - 0.5) * 80;
  const gazeAngleY = (data.gaze.y - 0.5) * -75;

  // Face bounding box center (driver on LEFT side of frame in RHD camera view)
  const faceCx = 220 + boxOffsetX;
  const faceCy = 190 + boxOffsetY;
  const faceW = 80;
  const faceH = 95;

  // Face confidence percentage
  const faceConfPct = Math.round(data.confidence.overall * 100);

  return (
    <div className="relative bg-dms-panel rounded-lg border border-dms-accent/30 shadow-[0_0_12px_rgba(0,212,255,0.15),inset_0_0_4px_rgba(0,212,255,0.05)] overflow-hidden h-full flex flex-col">
      {/* Main Video Area - Simulated cabin view */}
      <div className="flex-1 relative min-h-0">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ===== DEFS: Gradients, Filters, Markers ===== */}
          <defs>
            {/* Background gradient */}
            <linearGradient id="cvp-bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#060a12" />
              <stop offset="40%" stopColor="#0a1020" />
              <stop offset="100%" stopColor="#050810" />
            </linearGradient>

            {/* Windshield gradient */}
            <linearGradient id="cvp-windshieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1525" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0.3" />
            </linearGradient>

            {/* Seat gradient - driver */}
            <linearGradient id="cvp-driverSeatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a2845" />
              <stop offset="50%" stopColor="#12203a" />
              <stop offset="100%" stopColor="#0d1828" />
            </linearGradient>

            {/* Seat gradient - passenger (dimmer) */}
            <linearGradient id="cvp-passengerSeatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#121d35" />
              <stop offset="50%" stopColor="#0d1628" />
              <stop offset="100%" stopColor="#081020" />
            </linearGradient>

            {/* Headrest gradient */}
            <linearGradient id="cvp-headrestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e2d4a" />
              <stop offset="100%" stopColor="#0f1a2f" />
            </linearGradient>

            {/* Dashboard gradient */}
            <linearGradient id="cvp-dashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a0e17" />
              <stop offset="100%" stopColor="#0d1420" />
            </linearGradient>

            {/* Center console gradient */}
            <linearGradient id="cvp-consoleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f1825" />
              <stop offset="100%" stopColor="#080d18" />
            </linearGradient>

            {/* Steering wheel gradient */}
            <radialGradient id="cvp-steeringGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2845" />
              <stop offset="100%" stopColor="#0d1828" />
            </radialGradient>

            {/* Driver silhouette body gradient */}
            <linearGradient id="cvp-driverBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a2d4a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f1828" stopOpacity="0.85" />
            </linearGradient>

            {/* Driver head gradient */}
            <radialGradient id="cvp-driverHeadGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#1e3050" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#152540" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0d1828" stopOpacity="0.85" />
            </radialGradient>

            {/* Gaze arrow gradient */}
            <linearGradient id="cvp-gazeArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
            </linearGradient>

            {/* Seatbelt gradient */}
            <linearGradient id="cvp-seatbeltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3a4a60" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2a3a50" stopOpacity="0.6" />
            </linearGradient>

            {/* IR glow for face area */}
            <radialGradient id="cvp-faceIRGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </radialGradient>

            {/* Rear seats gradient */}
            <linearGradient id="cvp-rearSeatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1220" />
              <stop offset="100%" stopColor="#060a14" />
            </linearGradient>

            {/* Vignette radial gradient */}
            <radialGradient id="cvp-vignetteGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
            </radialGradient>

            {/* Eye region highlight glow */}
            <radialGradient id="cvp-eyeRegionGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.12" />
              <stop offset="80%" stopColor="#00e676" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#00e676" stopOpacity="0" />
            </radialGradient>

            {/* Shadow filter */}
            <filter id="cvp-shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
            </filter>

            {/* Soft glow filter */}
            <filter id="cvp-softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cyan glow for bounding box */}
            <filter id="cvp-cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0.8 0.8 0 0  0 0.8 1 0 0  0 0 0 0.6 0" result="colored" />
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Green glow for eye landmarks */}
            <filter id="cvp-greenGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 0.47  0 0 0 0.7 0" result="colored" />
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cyan glow for nose/mouth landmarks */}
            <filter id="cvp-cyanDotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0 0 0 0.83  0 0 0 0 1  0 0 0 0.6 0" result="colored" />
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Dim glow for jawline landmarks */}
            <filter id="cvp-jawGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.7  0 0 0 0 0.75  0 0 0 0 0.8  0 0 0 0.4 0" result="colored" />
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Noise texture filter */}
            <filter id="cvp-noiseFilter" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="5" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
              <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="noisy" />
              <feComponentTransfer in="noisy">
                <feFuncA type="linear" slope="0.04" />
              </feComponentTransfer>
            </filter>

            {/* Scanline pattern */}
            <pattern id="cvp-scanlines" patternUnits="userSpaceOnUse" width="800" height="4">
              <rect width="800" height="1" fill="#000000" opacity="0.08" />
              <rect y="2" width="800" height="1" fill="#ffffff" opacity="0.02" />
            </pattern>

            {/* Gaze arrowhead marker */}
            <marker id="cvp-gazeArrowHead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill="#00d4ff" opacity="0.8" />
            </marker>
          </defs>

          {/* ===== BACKGROUND ===== */}
          <rect x="0" y="0" width="800" height="500" fill="url(#cvp-bgGrad)" />

          {/* ===== WINDSHIELD TOP REGION ===== */}
          <rect x="0" y="0" width="800" height="80" fill="url(#cvp-windshieldGrad)" />
          <rect x="60" y="5" width="680" height="65" rx="3" fill="#0d1822" opacity="0.5" />
          {/* Windshield frame line */}
          <line x1="40" y1="75" x2="760" y2="75" stroke="#1a2840" strokeWidth="2" />

          {/* ===== REAR-VIEW MIRROR HOUSING ===== */}
          <path d="M 355,5 L 355,45 Q 355,52 362,52 L 438,52 Q 445,52 445,45 L 445,5 Z" fill="#0d1420" stroke="#1a2535" strokeWidth="1.5" filter="url(#cvp-shadowFilter)" />
          <rect x="365" y="12" width="70" height="32" rx="3" fill="#0a1118" stroke="#162030" strokeWidth="0.8" />
          {/* Mirror reflection hint */}
          <rect x="368" y="15" width="64" height="26" rx="2" fill="#080e18" opacity="0.7" />

          {/* ===== DASHBOARD / INSTRUMENT CLUSTER ===== */}
          <rect x="0" y="72" width="800" height="55" fill="url(#cvp-dashGrad)" filter="url(#cvp-shadowFilter)" />
          {/* Instrument cluster behind steering (driver side - left) */}
          <rect x="120" y="80" width="140" height="40" rx="6" fill="#080c14" stroke="#152030" strokeWidth="1" />
          {/* Instrument gauges (subtle circles) */}
          <circle cx="160" cy="100" r="12" fill="none" stroke="#1a2535" strokeWidth="0.8" />
          <circle cx="195" cy="100" r="12" fill="none" stroke="#1a2535" strokeWidth="0.8" />
          <circle cx="230" cy="100" r="8" fill="none" stroke="#1a2535" strokeWidth="0.6" />

          {/* ===== STEERING WHEEL (driver side - LEFT from camera POV) ===== */}
          <circle cx="220" cy="290" r="62" fill="none" stroke="#1e2d45" strokeWidth="8" filter="url(#cvp-shadowFilter)" />
          <circle cx="220" cy="290" r="62" fill="none" stroke="#253855" strokeWidth="3" />
          {/* Steering wheel inner hub */}
          <circle cx="220" cy="290" r="18" fill="url(#cvp-steeringGrad)" stroke="#253855" strokeWidth="2" />
          {/* Steering spokes */}
          <line x1="220" y1="272" x2="220" y2="240" stroke="#1e2d45" strokeWidth="5" strokeLinecap="round" />
          <line x1="200" y1="302" x2="170" y2="320" stroke="#1e2d45" strokeWidth="5" strokeLinecap="round" />
          <line x1="240" y1="302" x2="270" y2="320" stroke="#1e2d45" strokeWidth="5" strokeLinecap="round" />

          {/* ===== DRIVER SEAT (LEFT side - RHD) ===== */}
          {/* Seat back */}
          <path d="M 130,160 Q 130,140 150,135 L 290,135 Q 310,140 310,160 L 310,400 Q 310,420 290,420 L 150,420 Q 130,420 130,400 Z" fill="url(#cvp-driverSeatGrad)" stroke="#1e2d4a" strokeWidth="1.5" filter="url(#cvp-shadowFilter)" />
          {/* Seat cushion bottom */}
          <path d="M 135,380 Q 135,370 145,365 L 295,365 Q 305,370 305,380 L 305,440 Q 305,450 295,450 L 145,450 Q 135,450 135,440 Z" fill="#0f1a2d" stroke="#1a2540" strokeWidth="1" />
          {/* Headrest */}
          <rect x="170" y="120" width="100" height="45" rx="12" fill="url(#cvp-headrestGrad)" stroke="#253855" strokeWidth="1.5" filter="url(#cvp-shadowFilter)" />
          {/* Headrest center depression */}
          <ellipse cx="220" cy="140" rx="25" ry="12" fill="#0d1828" opacity="0.4" />

          {/* ===== PASSENGER SEAT (RIGHT side - dimmer) ===== */}
          {/* Seat back */}
          <path d="M 500,165 Q 500,145 520,140 L 660,140 Q 680,145 680,165 L 680,400 Q 680,420 660,420 L 520,420 Q 500,420 500,400 Z" fill="url(#cvp-passengerSeatGrad)" stroke="#152235" strokeWidth="1" opacity="0.8" />
          {/* Seat cushion */}
          <path d="M 505,380 Q 505,370 515,365 L 665,365 Q 675,370 675,380 L 675,440 Q 675,450 665,450 L 515,450 Q 505,450 505,440 Z" fill="#0a1220" stroke="#12202f" strokeWidth="0.8" opacity="0.8" />
          {/* Headrest */}
          <rect x="545" y="125" width="90" height="42" rx="10" fill="#121d30" stroke="#1a2840" strokeWidth="1" opacity="0.75" />

          {/* ===== CENTER CONSOLE ===== */}
          <rect x="320" y="200" width="170" height="280" rx="6" fill="url(#cvp-consoleGrad)" stroke="#1a2535" strokeWidth="1" filter="url(#cvp-shadowFilter)" />
          {/* Gear lever area */}
          <rect x="370" y="310" width="70" height="55" rx="5" fill="#080d18" stroke="#12202f" strokeWidth="1" />
          {/* Gear lever knob */}
          <ellipse cx="405" cy="325" rx="10" ry="8" fill="#1a2540" stroke="#253550" strokeWidth="1" />
          {/* Gear lever shaft */}
          <line x1="405" y1="333" x2="405" y2="355" stroke="#1a2540" strokeWidth="3" strokeLinecap="round" />
          {/* Cup holders hint */}
          <circle cx="380" cy="395" r="14" fill="#060a12" stroke="#0f1820" strokeWidth="0.8" />
          <circle cx="430" cy="395" r="14" fill="#060a12" stroke="#0f1820" strokeWidth="0.8" />
          {/* Center console trim */}
          <line x1="330" y1="280" x2="480" y2="280" stroke="#1a2535" strokeWidth="0.5" opacity="0.5" />

          {/* ===== REAR SEATS (partially visible at bottom) ===== */}
          <rect x="60" y="455" width="680" height="50" rx="5" fill="url(#cvp-rearSeatGrad)" stroke="#0f1825" strokeWidth="1" />
          <line x1="280" y1="455" x2="280" y2="500" stroke="#0a1018" strokeWidth="1" opacity="0.5" />
          <line x1="520" y1="455" x2="520" y2="500" stroke="#0a1018" strokeWidth="1" opacity="0.5" />

          {/* ===== DRIVER SILHOUETTE ===== */}
          {/* Upper torso and shoulders */}
          <path d="M 150,250 Q 160,230 185,225 L 255,225 Q 280,230 290,250 L 295,360 L 145,360 Z" fill="url(#cvp-driverBodyGrad)" stroke="#253855" strokeWidth="1" opacity="0.9" />

          {/* Neck */}
          <path d="M 200,185 Q 200,200 195,215 L 195,225 L 245,225 L 245,215 Q 240,200 240,185" fill="url(#cvp-driverBodyGrad)" stroke="#253855" strokeWidth="0.8" opacity="0.85" />

          {/* Head (oval, human-like) */}
          <ellipse cx={faceCx} cy={faceCy} rx="38" ry="48" fill="url(#cvp-driverHeadGrad)" stroke="#253855" strokeWidth="1.2" />
          {/* Hair/top of head darker region */}
          <ellipse cx={faceCx} cy={faceCy - 25} rx="32" ry="25" fill="#0d1828" opacity="0.5" />

          {/* IR glow on face */}
          <ellipse cx={faceCx} cy={faceCy} rx="50" ry="60" fill="url(#cvp-faceIRGlow)" />

          {/* Left arm reaching to steering wheel */}
          <path d="M 265,260 Q 275,280 270,310 Q 265,330 250,340" fill="none" stroke="#1a2d4a" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
          {/* Right arm */}
          <path d="M 150,260 Q 140,280 145,300 Q 148,320 155,335" fill="none" stroke="#1a2d4a" strokeWidth="8" strokeLinecap="round" opacity="0.7" />

          {/* Seatbelt diagonal across chest */}
          <line x1="270" y1="155" x2="175" y2="360" stroke="url(#cvp-seatbeltGrad)" strokeWidth="5" strokeLinecap="round" />
          {/* Seatbelt buckle hint */}
          <rect x="178" y="345" width="12" height="18" rx="2" fill="#2a3a55" stroke="#3a4a65" strokeWidth="0.8" />

          {/* ===== FACE BOUNDING BOX ===== */}
          <g filter="url(#cvp-cyanGlow)">
            {/* Main box */}
            <rect
              x={faceCx - faceW / 2}
              y={faceCy - faceH / 2}
              width={faceW}
              height={faceH}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              opacity="0.9"
            />
            {/* Corner accents - top left */}
            <path d={`M ${faceCx - faceW / 2} ${faceCy - faceH / 2 + 12} L ${faceCx - faceW / 2} ${faceCy - faceH / 2} L ${faceCx - faceW / 2 + 12} ${faceCy - faceH / 2}`} fill="none" stroke="#00d4ff" strokeWidth="2.5" />
            {/* Corner accents - top right */}
            <path d={`M ${faceCx + faceW / 2 - 12} ${faceCy - faceH / 2} L ${faceCx + faceW / 2} ${faceCy - faceH / 2} L ${faceCx + faceW / 2} ${faceCy - faceH / 2 + 12}`} fill="none" stroke="#00d4ff" strokeWidth="2.5" />
            {/* Corner accents - bottom left */}
            <path d={`M ${faceCx - faceW / 2} ${faceCy + faceH / 2 - 12} L ${faceCx - faceW / 2} ${faceCy + faceH / 2} L ${faceCx - faceW / 2 + 12} ${faceCy + faceH / 2}`} fill="none" stroke="#00d4ff" strokeWidth="2.5" />
            {/* Corner accents - bottom right */}
            <path d={`M ${faceCx + faceW / 2 - 12} ${faceCy + faceH / 2} L ${faceCx + faceW / 2} ${faceCy + faceH / 2} L ${faceCx + faceW / 2} ${faceCy + faceH / 2 - 12}`} fill="none" stroke="#00d4ff" strokeWidth="2.5" />
          </g>

          {/* ===== EYE REGION HIGHLIGHT (ROI) ===== */}
          {/* Left eye region */}
          <ellipse cx={faceCx - 19} cy={faceCy - 8} rx="18" ry="10" fill="url(#cvp-eyeRegionGlow)" stroke="#00e676" strokeWidth="0.5" opacity="0.5" />
          {/* Right eye region */}
          <ellipse cx={faceCx + 19} cy={faceCy - 8} rx="18" ry="10" fill="url(#cvp-eyeRegionGlow)" stroke="#00e676" strokeWidth="0.5" opacity="0.5" />

          {/* ===== FACIAL LANDMARKS (~29 dots) ===== */}

          {/* --- Eyebrows: 3 dots per eyebrow = 6 --- */}
          <g filter="url(#cvp-greenGlow)">
            {/* Left eyebrow: inner, middle, outer */}
            <circle cx={faceCx - 12} cy={faceCy - 18} r="1.6" fill="#00e676" />
            <circle cx={faceCx - 19} cy={faceCy - 20} r="1.6" fill="#00e676" />
            <circle cx={faceCx - 26} cy={faceCy - 17} r="1.6" fill="#00e676" />
            {/* Right eyebrow: inner, middle, outer */}
            <circle cx={faceCx + 12} cy={faceCy - 18} r="1.6" fill="#00e676" />
            <circle cx={faceCx + 19} cy={faceCy - 20} r="1.6" fill="#00e676" />
            <circle cx={faceCx + 26} cy={faceCy - 17} r="1.6" fill="#00e676" />
          </g>

          {/* --- Eyes: 4 per eye = 8 --- */}
          <g filter="url(#cvp-greenGlow)">
            {/* Left eye: inner corner, outer corner, upper lid, lower lid */}
            <circle cx={faceCx - 14} cy={faceCy - 8} r="2.2" fill="#00e676" />
            <circle cx={faceCx - 24} cy={faceCy - 8} r="2.2" fill="#00e676" />
            <circle cx={faceCx - 19} cy={faceCy - 12} r="1.8" fill="#00e676" />
            <circle cx={faceCx - 19} cy={faceCy - 5} r="1.8" fill="#00e676" />
            {/* Right eye: inner corner, outer corner, upper lid, lower lid */}
            <circle cx={faceCx + 14} cy={faceCy - 8} r="2.2" fill="#00e676" />
            <circle cx={faceCx + 24} cy={faceCy - 8} r="2.2" fill="#00e676" />
            <circle cx={faceCx + 19} cy={faceCy - 12} r="1.8" fill="#00e676" />
            <circle cx={faceCx + 19} cy={faceCy - 5} r="1.8" fill="#00e676" />
          </g>

          {/* --- Nose: bridge, tip, left wing, right wing = 4 --- */}
          <g filter="url(#cvp-cyanDotGlow)">
            <circle cx={faceCx} cy={faceCy - 2} r="1.8" fill="#00d4ff" />
            <circle cx={faceCx} cy={faceCy + 10} r="2.2" fill="#00d4ff" />
            <circle cx={faceCx - 8} cy={faceCy + 8} r="1.6" fill="#00d4ff" />
            <circle cx={faceCx + 8} cy={faceCy + 8} r="1.6" fill="#00d4ff" />
          </g>

          {/* --- Mouth: upper lip center, lower lip center, left corner, right corner = 4 --- */}
          <g filter="url(#cvp-cyanDotGlow)">
            <circle cx={faceCx} cy={faceCy + 20} r="1.8" fill="#00d4ff" />
            <circle cx={faceCx} cy={faceCy + 26} r="1.8" fill="#00d4ff" />
            <circle cx={faceCx - 12} cy={faceCy + 22} r="1.8" fill="#00d4ff" />
            <circle cx={faceCx + 12} cy={faceCy + 22} r="1.8" fill="#00d4ff" />
          </g>

          {/* --- Jawline: 7 dots along jaw curve from left ear to chin to right ear --- */}
          <g filter="url(#cvp-jawGlow)">
            <circle cx={faceCx - 35} cy={faceCy + 5} r="1.4" fill="#94a3b8" opacity="0.7" />
            <circle cx={faceCx - 30} cy={faceCy + 20} r="1.4" fill="#94a3b8" opacity="0.7" />
            <circle cx={faceCx - 22} cy={faceCy + 32} r="1.4" fill="#94a3b8" opacity="0.7" />
            <circle cx={faceCx} cy={faceCy + 38} r="1.5" fill="#94a3b8" opacity="0.7" />
            <circle cx={faceCx + 22} cy={faceCy + 32} r="1.4" fill="#94a3b8" opacity="0.7" />
            <circle cx={faceCx + 30} cy={faceCy + 20} r="1.4" fill="#94a3b8" opacity="0.7" />
            <circle cx={faceCx + 35} cy={faceCy + 5} r="1.4" fill="#94a3b8" opacity="0.7" />
          </g>

          {/* ===== GAZE DIRECTION ARROW ===== */}
          <line
            x1={faceCx}
            y1={faceCy - 10}
            x2={faceCx + gazeAngleX}
            y2={faceCy - 10 + gazeAngleY}
            stroke="url(#cvp-gazeArrowGrad)"
            strokeWidth="3"
            markerEnd="url(#cvp-gazeArrowHead)"
            opacity="0.85"
          />

          {/* ===== RGB HEAD POSE AXIS (upper-right of face bbox) ===== */}
          <g transform={`translate(${faceCx + 50}, ${faceCy - 50})`}>
            {/* X axis - Yaw (Red) */}
            <line x1="0" y1="0" x2={data.headPose.yaw * 0.5} y2="0" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" />
            <text x={data.headPose.yaw * 0.5 + (data.headPose.yaw >= 0 ? 4 : -10)} y="4" fill="#ff4444" fontSize="8" fontFamily="monospace">X</text>
            {/* Y axis - Pitch (Green) */}
            <line x1="0" y1="0" x2="0" y2={-data.headPose.pitch * 0.5} stroke="#44ff44" strokeWidth="2.5" strokeLinecap="round" />
            <text x="3" y={-data.headPose.pitch * 0.5 + (data.headPose.pitch >= 0 ? -4 : 10)} fill="#44ff44" fontSize="8" fontFamily="monospace">Y</text>
            {/* Z axis - Roll (Blue) */}
            <line x1="0" y1="0" x2={data.headPose.roll * 0.35} y2={data.headPose.roll * 0.35} stroke="#4488ff" strokeWidth="2.5" strokeLinecap="round" />
            <text x={data.headPose.roll * 0.35 + (data.headPose.roll >= 0 ? 4 : -10)} y={data.headPose.roll * 0.35 + 4} fill="#4488ff" fontSize="8" fontFamily="monospace">Z</text>
            {/* Origin dot */}
            <circle cx="0" cy="0" r="2" fill="#ffffff" opacity="0.6" />
          </g>

          {/* ===== NOISE TEXTURE OVERLAY ===== */}
          <rect x="0" y="0" width="800" height="500" filter="url(#cvp-noiseFilter)" opacity="0.3" fill="transparent" />

          {/* ===== SCANLINE OVERLAY ===== */}
          <rect x="0" y="0" width="800" height="500" fill="url(#cvp-scanlines)" opacity="0.6" />

          {/* ===== VIGNETTE EFFECT ===== */}
          <rect x="0" y="0" width="800" height="500" fill="url(#cvp-vignetteGrad)" />
        </svg>
      </div>

      {/* ===== OVERLAY LABELS ===== */}
      {/* Top-left: Recording indicator + camera label */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-dms-danger animate-pulse shadow-[0_0_4px_rgba(255,45,85,0.6)]" />
        <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
          CAM-01 IR 940nm
        </span>
      </div>

      {/* Top-right: Driver info, Face confidence, Gaze, State */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-dms-accent bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            Driver D1
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            Face {faceConfPct}%
          </span>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm ${
          data.gaze.onRoad ? 'text-dms-success bg-dms-success/10' : 'text-dms-warning bg-dms-warning/10'
        }`}>
          Gaze: {gazeLabel}
        </span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm ${stateColorClass} bg-black/60`}>
          State: {stateLabel}
        </span>
      </div>

      {/* Bottom-left: Timestamp and illumination */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 z-10">
        <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
          {getCurrentTime()}
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
          Illumination: Auto
        </span>
      </div>

      {/* Confidence bar at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80">
        <div
          className="h-full bg-dms-accent/60 transition-all duration-300"
          style={{ width: `${data.confidence.overall * 100}%` }}
        />
      </div>
    </div>
  );
};
