import React, { useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import { DMSTelemetry, DriverState } from '../../types/dms';

interface BottomTimelineProps {
  data: DMSTelemetry;
}

interface TimelineDataPoint {
  t: number;
  eyesOffRoad: number;
  blinkRate: number;
  perclos: number;
  phoneUse: number;
  seatbelt: number;
  confidence: number;
}

const MAX_POINTS = 60;

// Mini sparkline chart component
interface SparklineProps {
  data: TimelineDataPoint[];
  dataKey: string;
  color: string;
  label: string;
  maxY?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, dataKey, color, label, maxY = 1 }) => (
  <div className="flex flex-col h-full">
    <span className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5 px-1">{label}</span>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, maxY]} hide />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#gradient-${dataKey})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Alert history bar
interface AlertMarker {
  time: number;
  type: 'warning' | 'danger' | 'info';
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({ data }) => {
  const historyRef = useRef<TimelineDataPoint[]>([]);
  const alertsRef = useRef<AlertMarker[]>([]);
  const counterRef = useRef(0);

  // Update rolling buffer
  useEffect(() => {
    const point: TimelineDataPoint = {
      t: counterRef.current++,
      eyesOffRoad: data.distraction.gazeOffRoad ? data.distraction.duration_ms / 5000 : 0,
      blinkRate: data.drowsiness.blinkRate / 30, // normalize to 0-1 range (30 blinks/min max)
      perclos: data.drowsiness.perclos,
      phoneUse: data.phoneSuspicion.confidence,
      seatbelt: data.seatbelt.worn ? 1 : 0,
      confidence: data.confidence.overall,
    };

    historyRef.current = [...historyRef.current, point].slice(-MAX_POINTS);

    // Track alerts
    if (data.driverState !== DriverState.ATTENTIVE) {
      const alertType = data.driverState === DriverState.DROWSY || data.driverState === DriverState.DISTRACTED ? 'warning' : 'danger';
      // Only add alert if different from last one or if some time passed
      const lastAlert = alertsRef.current[alertsRef.current.length - 1];
      if (!lastAlert || counterRef.current - lastAlert.time > 5) {
        alertsRef.current = [...alertsRef.current, { time: counterRef.current, type: alertType }].slice(-20);
      }
    }
  });

  const chartData = historyRef.current;
  const alerts = alertsRef.current;

  return (
    <div className="bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] p-2 h-full flex flex-col">
      {/* Charts Row */}
      <div className="flex-1 grid grid-cols-6 gap-1 min-h-0">
        <Sparkline data={chartData} dataKey="eyesOffRoad" color="#ff6b35" label="Eyes Off Road" />
        <Sparkline data={chartData} dataKey="blinkRate" color="#00d4ff" label="Blink Rate" />
        <Sparkline data={chartData} dataKey="perclos" color="#ffbb33" label="PERCLOS" />
        <Sparkline data={chartData} dataKey="phoneUse" color="#ff2d55" label="Phone Use" />
        <Sparkline data={chartData} dataKey="seatbelt" color="#00e676" label="Seatbelt" />
        <Sparkline data={chartData} dataKey="confidence" color="#00d4ff" label="DMS Conf." />
      </div>

      {/* Alert Timeline Bar */}
      <div className="mt-1 pt-1 border-t border-slate-700/30">
        <div className="flex items-center gap-1">
          <span className="text-[7px] text-slate-500 uppercase shrink-0">Alerts</span>
          <div className="flex-1 h-3 bg-slate-900/50 rounded-sm relative overflow-hidden">
            {alerts.map((alert, i) => {
              const position = ((alert.time % MAX_POINTS) / MAX_POINTS) * 100;
              return (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 w-1 rounded-sm ${
                    alert.type === 'danger' ? 'bg-dms-danger' : alert.type === 'warning' ? 'bg-dms-warning' : 'bg-dms-accent'
                  }`}
                  style={{ left: `${position}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
