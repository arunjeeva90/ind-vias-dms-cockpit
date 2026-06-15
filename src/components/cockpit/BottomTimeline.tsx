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

// State history entry
interface StateHistoryEntry {
  state: DriverState;
  time: number;
}

// State color and label mappings
function getStateChipColor(state: DriverState): string {
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'bg-dms-success';
    case DriverState.DROWSY:
      return 'bg-cyan-400';
    case DriverState.DISTRACTED:
      return 'bg-amber-400';
    case DriverState.FATIGUED:
      return 'bg-dms-danger';
    case DriverState.PHONE_USE:
      return 'bg-fuchsia-500';
    default:
      return 'bg-slate-500';
  }
}

function getStateChipLabel(state: DriverState): string {
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'ATT';
    case DriverState.DROWSY:
      return 'DRW';
    case DriverState.DISTRACTED:
      return 'DST';
    case DriverState.FATIGUED:
      return 'FTG';
    case DriverState.PHONE_USE:
      return 'PHN';
    default:
      return 'UNK';
  }
}

// Mini sparkline chart component
interface SparklineProps {
  data: TimelineDataPoint[];
  dataKey: string;
  color: string;
  label: string;
  maxY?: number;
  isFirst?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ data, dataKey, color, label, maxY = 1, isFirst = false }) => {
  // Get current value from last data point
  const lastPoint = data[data.length - 1];
  const currentValue = lastPoint ? Math.round((lastPoint[dataKey as keyof TimelineDataPoint] as number) * 100) : 0;

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-slate-800/30 to-transparent rounded ${!isFirst ? 'border-l border-slate-700/20' : ''}`}>
      <span className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5 px-1.5 pt-0.5">{label}</span>
      <span className="text-[11px] font-mono font-bold px-1.5" style={{ color }}>{currentValue}%</span>
      <div className="flex-1 min-h-0 px-0.5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
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
};

// Alert history bar
interface AlertMarker {
  time: number;
  type: 'warning' | 'danger' | 'info';
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({ data }) => {
  const historyRef = useRef<TimelineDataPoint[]>([]);
  const alertsRef = useRef<AlertMarker[]>([]);
  const stateHistoryRef = useRef<StateHistoryEntry[]>([]);
  const counterRef = useRef(0);
  const prevTimestampRef = useRef<number>(0);

  // Update rolling buffer - only when telemetry data actually changes
  useEffect(() => {
    if (data.timestamp === prevTimestampRef.current) {
      return;
    }
    prevTimestampRef.current = data.timestamp;

    const point: TimelineDataPoint = {
      t: counterRef.current++,
      eyesOffRoad: data.distraction.gazeOffRoad ? data.distraction.duration_ms / 5000 : 0,
      blinkRate: data.drowsiness.blinkRate / 30, // normalize to 0-1 range (30 blinks/min max)
      perclos: data.drowsiness.perclos / 100,
      phoneUse: data.phoneSuspicion.confidence / 100,
      seatbelt: data.seatbelt.worn ? 1 : 0,
      confidence: data.confidence.overall,
    };

    historyRef.current = [...historyRef.current, point].slice(-MAX_POINTS);

    // Track state history - only add when state changes
    const lastState = stateHistoryRef.current[stateHistoryRef.current.length - 1];
    if (!lastState || lastState.state !== data.driverState) {
      stateHistoryRef.current = [
        ...stateHistoryRef.current,
        { state: data.driverState, time: counterRef.current },
      ].slice(-10);
    }

    // Track alerts
    if (data.driverState !== DriverState.ATTENTIVE) {
      const alertType = data.driverState === DriverState.DROWSY || data.driverState === DriverState.DISTRACTED ? 'warning' : 'danger';
      // Only add alert if different from last one or if some time passed
      const lastAlert = alertsRef.current[alertsRef.current.length - 1];
      if (!lastAlert || counterRef.current - lastAlert.time > 5) {
        alertsRef.current = [...alertsRef.current, { time: counterRef.current, type: alertType }].slice(-20);
      }
    }
  }, [data]);

  const chartData = historyRef.current;
  const alerts = alertsRef.current;
  const stateHistory = stateHistoryRef.current;

  return (
    <div className="bg-dms-panel rounded-lg border border-dms-accent/20 shadow-[0_0_8px_rgba(0,212,255,0.1)] p-2 h-full flex flex-col">
      {/* State History Chip Row */}
      <div className="flex items-center gap-1 mb-1.5 px-1">
        <span className="text-[7px] text-slate-500 uppercase shrink-0 mr-1">State History</span>
        <div className="flex items-center gap-0.5 flex-wrap">
          {stateHistory.map((entry) => (
            <span
              key={entry.time}
              className={`px-1.5 py-0.5 rounded text-[7px] font-bold text-white ${getStateChipColor(entry.state)}`}
            >
              {getStateChipLabel(entry.state)}
            </span>
          ))}
          {stateHistory.length === 0 && (
            <span className="text-[8px] text-slate-600 italic">No transitions</span>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="flex-1 grid grid-cols-6 gap-0.5 min-h-0">
        <Sparkline data={chartData} dataKey="eyesOffRoad" color="#ff6b35" label="Eyes Off Road" isFirst />
        <Sparkline data={chartData} dataKey="blinkRate" color="#00d4ff" label="Blink Rate" />
        <Sparkline data={chartData} dataKey="perclos" color="#ffbb33" label="PERCLOS" />
        <Sparkline data={chartData} dataKey="phoneUse" color="#ff2d55" label="Phone Use" />
        <Sparkline data={chartData} dataKey="seatbelt" color="#00e676" label="Seatbelt" />
        <Sparkline data={chartData} dataKey="confidence" color="#00d4ff" label="DMS Conf." />
      </div>

      {/* Alert Timeline Bar */}
      <div className="mt-1.5 pt-1 border-t border-slate-700/30">
        <div className="flex items-center gap-1">
          <span className="text-[7px] text-slate-500 uppercase shrink-0">Alerts</span>
          <div className="flex-1 h-3.5 bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded relative overflow-hidden border border-slate-700/20">
            {alerts.map((alert) => {
              const position = ((alert.time % MAX_POINTS) / MAX_POINTS) * 100;
              const alertColor = alert.type === 'danger' ? '#ff2d55' : alert.type === 'warning' ? '#ff6b35' : '#00d4ff';
              return (
                <div
                  key={alert.time}
                  className={`absolute top-0.5 bottom-0.5 w-2 rounded-full ${
                    alert.type === 'danger' ? 'bg-dms-danger' : alert.type === 'warning' ? 'bg-dms-warning' : 'bg-dms-accent'
                  }`}
                  style={{
                    left: `${position}%`,
                    boxShadow: `0 0 6px ${alertColor}, 0 0 2px ${alertColor}`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
