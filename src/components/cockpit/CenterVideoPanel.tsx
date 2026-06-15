import React from 'react';
import { DMSTelemetry, DriverState } from '../../types/dms';

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

function getStateOverlayLabel(state: DriverState): string {
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'Normal';
    case DriverState.DROWSY:
      return 'Monitor';
    case DriverState.DISTRACTED:
      return 'Warning';
    case DriverState.FATIGUED:
      return 'Danger';
    case DriverState.PHONE_USE:
      return 'Alert';
    default:
      return 'Unknown';
  }
}

function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour12: false });
}

export const CenterVideoPanel: React.FC<CenterVideoPanelProps> = ({ data }) => {
  const gazeLabel = getGazeLabel(data);
  const stateLabel = getStateOverlayLabel(data.driverState);

  // Head pose affects bounding box position slightly
  const boxOffsetX = data.headPose.yaw * 0.3;
  const boxOffsetY = data.headPose.pitch * 0.3;

  // Gaze arrow direction
  const gazeAngleX = (data.gaze.x - 0.5) * 60;
  const gazeAngleY = (data.gaze.y - 0.5) * 40;

  return (
    <div className="relative bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] overflow-hidden h-full flex flex-col">
      {/* Camera View Label */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-dms-danger animate-pulse" />
        <span className="text-[10px] font-mono text-slate-300 bg-black/50 px-1.5 py-0.5 rounded">
          CAM-01 IR 940nm
        </span>
      </div>

      {/* Main Video Area - Simulated cabin view */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-0">
        {/* Cabin interior simulation - RHD (driver on LEFT from camera view) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
          {/* Dashboard/windshield top */}
          <rect x="0" y="0" width="800" height="60" fill="#0a0e17" opacity="0.6" />
          
          {/* Rear-view mirror at top center */}
          <rect x="360" y="10" width="80" height="35" rx="4" fill="#1a2035" stroke="#2a3550" strokeWidth="1" />
          
          {/* Windshield visible through top */}
          <rect x="50" y="0" width="700" height="80" fill="#0f1520" opacity="0.4" />

          {/* Left seat area (DRIVER in RHD) */}
          <path d="M 80,200 Q 80,150 120,130 L 250,130 Q 290,150 290,200 L 290,420 L 80,420 Z" 
                fill="#151f35" stroke="#1f2f4a" strokeWidth="1.5" />
          {/* Headrest */}
          <rect x="130" y="110" width="80" height="40" rx="8" fill="#1a2540" stroke="#253555" strokeWidth="1" />
          
          {/* Steering wheel (right side of driver, left side of frame for RHD) */}
          <circle cx="310" cy="320" r="55" fill="none" stroke="#2a3a55" strokeWidth="4" />
          <circle cx="310" cy="320" r="20" fill="#1a2540" stroke="#2a3a55" strokeWidth="2" />

          {/* Right seat area (PASSENGER) */}
          <path d="M 510,200 Q 510,150 550,130 L 680,130 Q 720,150 720,200 L 720,420 L 510,420 Z"
                fill="#121a2d" stroke="#1a2840" strokeWidth="1" />
          {/* Headrest */}
          <rect x="565" y="110" width="80" height="40" rx="8" fill="#151f35" stroke="#1f2f4a" strokeWidth="1" />

          {/* Center console */}
          <rect x="300" y="250" width="200" height="200" rx="4" fill="#0f1825" stroke="#1a2840" strokeWidth="1" />
          {/* Gear area */}
          <rect x="370" y="320" width="60" height="40" rx="4" fill="#0a1020" stroke="#1a2535" strokeWidth="1" />

          {/* Rear seats (partially visible) */}
          <rect x="100" y="440" width="600" height="60" rx="4" fill="#0d1525" stroke="#152035" strokeWidth="1" />

          {/* Driver silhouette on LEFT */}
          <ellipse cx="185" cy="200" rx="40" ry="50" fill="#1a2540" stroke="#253555" strokeWidth="1.5" />
          {/* Shoulders */}
          <path d="M 120,280 Q 185,250 250,280 L 250,350 L 120,350 Z" fill="#1a2540" stroke="#253555" strokeWidth="1" />
        </svg>

        {/* Face Bounding Box - Positioned over driver (left side) */}
        <div
          className="absolute border-2 border-dms-accent rounded-sm transition-all duration-200 shadow-[0_0_6px_rgba(0,212,255,0.3)]"
          style={{
            left: `${18 + boxOffsetX * 0.1}%`,
            top: `${22 + boxOffsetY * 0.1}%`,
            width: '14%',
            height: '26%',
          }}
        >
          {/* Corner accents */}
          <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-dms-accent" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-dms-accent" />
          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-dms-accent" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-dms-accent" />
        </div>

        {/* Facial Landmark Dots */}
        <div className="absolute" style={{ left: `${20 + boxOffsetX * 0.1}%`, top: `${30 + boxOffsetY * 0.1}%` }}>
          {/* Left eye */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-dms-success shadow-[0_0_4px_rgba(0,230,118,0.6)]" style={{ left: '10px', top: '0px' }} />
          {/* Right eye */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-dms-success shadow-[0_0_4px_rgba(0,230,118,0.6)]" style={{ left: '40px', top: '0px' }} />
          {/* Nose */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-dms-accent shadow-[0_0_4px_rgba(0,212,255,0.6)]" style={{ left: '25px', top: '20px' }} />
          {/* Mouth left */}
          <div className="absolute w-1 h-1 rounded-full bg-dms-accent shadow-[0_0_3px_rgba(0,212,255,0.4)]" style={{ left: '14px', top: '35px' }} />
          {/* Mouth right */}
          <div className="absolute w-1 h-1 rounded-full bg-dms-accent shadow-[0_0_3px_rgba(0,212,255,0.4)]" style={{ left: '36px', top: '35px' }} />
          {/* Mouth center */}
          <div className="absolute w-1 h-1 rounded-full bg-dms-accent shadow-[0_0_3px_rgba(0,212,255,0.4)]" style={{ left: '25px', top: '37px' }} />
        </div>

        {/* Gaze Arrow */}
        <div
          className="absolute"
          style={{
            left: `${24 + boxOffsetX * 0.1}%`,
            top: `${30 + boxOffsetY * 0.1}%`,
          }}
        >
          <svg width="80" height="60" className="overflow-visible">
            <defs>
              <marker id="gazeArrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0,0 6,3 0,6" fill="#00d4ff" />
              </marker>
            </defs>
            <line
              x1="30"
              y1="10"
              x2={30 + gazeAngleX}
              y2={10 + gazeAngleY}
              stroke="#00d4ff"
              strokeWidth="2"
              opacity="0.8"
              markerEnd="url(#gazeArrowHead)"
            />
          </svg>
        </div>

        {/* Head Pose Axes */}
        <div
          className="absolute"
          style={{
            left: `${15 + boxOffsetX * 0.1}%`,
            top: `${47 + boxOffsetY * 0.1}%`,
          }}
        >
          <svg width="40" height="40" className="overflow-visible">
            {/* X axis - Red */}
            <line x1="20" y1="20" x2={20 + data.headPose.yaw * 0.3} y2="20" stroke="#ff4444" strokeWidth="2" />
            <text x={20 + data.headPose.yaw * 0.3 + 3} y="22" fill="#ff4444" fontSize="7">X</text>
            {/* Y axis - Green */}
            <line x1="20" y1="20" x2="20" y2={20 - data.headPose.pitch * 0.3} stroke="#44ff44" strokeWidth="2" />
            <text x="22" y={20 - data.headPose.pitch * 0.3 - 3} fill="#44ff44" fontSize="7">Y</text>
            {/* Z axis - Blue */}
            <line x1="20" y1="20" x2={20 + data.headPose.roll * 0.2} y2={20 + data.headPose.roll * 0.2} stroke="#4488ff" strokeWidth="2" />
            <text x={20 + data.headPose.roll * 0.2 + 3} y={20 + data.headPose.roll * 0.2 + 3} fill="#4488ff" fontSize="7">Z</text>
          </svg>
        </div>
      </div>

      {/* Overlay Labels */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
        <span className="text-[10px] font-mono text-dms-accent bg-black/60 px-1.5 py-0.5 rounded">
          Driver D1
        </span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          data.gaze.onRoad ? 'text-dms-success bg-dms-success/10' : 'text-dms-warning bg-dms-warning/10'
        }`}>
          Gaze: {gazeLabel}
        </span>
        <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
          State: {stateLabel}
        </span>
      </div>

      {/* Bottom overlay labels */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 z-10">
        <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
          {getCurrentTime()}
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
          Illumination: Auto
        </span>
      </div>

      {/* Confidence bar at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
        <div
          className="h-full bg-dms-accent/60 transition-all duration-300"
          style={{ width: `${data.confidence.overall * 100}%` }}
        />
      </div>
    </div>
  );
};
