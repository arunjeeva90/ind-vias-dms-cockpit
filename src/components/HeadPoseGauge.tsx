import React from 'react';
import { HeadPose } from '../types/dms';

interface HeadPoseGaugeProps {
  headPose: HeadPose;
}

interface ArcGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
}

const ArcGauge: React.FC<ArcGaugeProps> = ({ label, value, min, max }) => {
  const range = max - min;
  const normalized = (value - min) / range; // 0 to 1
  const angle = -90 + normalized * 180; // -90 to 90 degrees

  // Arc dimensions
  const cx = 50;
  const cy = 55;
  const radius = 35;

  // Color based on distance from center
  const distFromCenter = Math.abs(normalized - 0.5) * 2; // 0 at center, 1 at extremes
  let color = '#00e676'; // green
  if (distFromCenter > 0.7) color = '#ff2d55'; // red
  else if (distFromCenter > 0.4) color = '#ff6b35'; // warning

  // Create arc path
  const startAngle = -180;
  const endAngle = 0;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;

  // Needle position
  const needleRad = ((angle - 90) * Math.PI) / 180;
  const needleX = cx + (radius - 5) * Math.cos(needleRad);
  const needleY = cy + (radius - 5) * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 65" className="w-full h-auto max-w-[100px]">
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Colored arc (partial based on value) */}
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Needle dot */}
        <circle
          cx={needleX}
          cy={needleY}
          r="4"
          fill={color}
          className="transition-all duration-100"
        />
        {/* Center point */}
        <circle cx={cx} cy={cy} r="2" fill="#64748b" />
        {/* Value text */}
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          className="text-[8px] fill-slate-300 font-mono"
        >
          {value.toFixed(1)}°
        </text>
      </svg>
      <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
};

export const HeadPoseGauge: React.FC<HeadPoseGaugeProps> = ({ headPose }) => {
  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        Head Pose
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <ArcGauge label="Yaw" value={headPose.yaw} min={-90} max={90} />
        <ArcGauge label="Pitch" value={headPose.pitch} min={-90} max={90} />
        <ArcGauge label="Roll" value={headPose.roll} min={-90} max={90} />
      </div>
    </div>
  );
};
