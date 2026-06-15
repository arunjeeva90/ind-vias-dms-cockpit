import React from 'react';
import { Activity, Camera, Radio, Wifi, WifiOff, MonitorDot } from 'lucide-react';
import { DriverState, DMSTelemetry } from '../../types/dms';

interface StatusBarProps {
  data: DMSTelemetry | null;
  connected: boolean;
  mode: string;
}

function getStateColor(state?: DriverState): string {
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'text-dms-success';
    case DriverState.DROWSY:
      return 'text-yellow-400';
    case DriverState.DISTRACTED:
      return 'text-dms-warning';
    case DriverState.FATIGUED:
      return 'text-dms-danger';
    case DriverState.PHONE_USE:
      return 'text-dms-danger';
    default:
      return 'text-slate-400';
  }
}

function getStateLabel(state?: DriverState): string {
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'ATTENTIVE';
    case DriverState.DROWSY:
      return 'DROWSY';
    case DriverState.DISTRACTED:
      return 'DISTRACTED';
    case DriverState.FATIGUED:
      return 'FATIGUED';
    case DriverState.PHONE_USE:
      return 'PHONE USE';
    default:
      return 'N/A';
  }
}

export const StatusBar: React.FC<StatusBarProps> = ({ data, connected, mode }) => {
  const fps = data ? 30 : 0;
  const cameraHealth = data?.confidence.faceDetected ? 'OK' : 'NO FACE';
  const tracking = data?.confidence.faceDetected ? 'LOCKED' : 'LOST';

  return (
    <div className="h-12 bg-dms-panel/80 border-b border-dms-accent/20 flex items-center px-4 gap-6 shadow-[0_2px_8px_rgba(0,212,255,0.05)]">
      {/* Title */}
      <div className="flex items-center gap-2 mr-4">
        <MonitorDot className="w-5 h-5 text-dms-accent" />
        <span className="text-sm font-bold text-dms-accent tracking-wider whitespace-nowrap">
          IND-VIAS DualSight DMS Cockpit
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-700" />

      {/* Driver State */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 uppercase">State</span>
        <span className={`text-xs font-bold uppercase ${getStateColor(data?.driverState)}`}>
          {getStateLabel(data?.driverState)}
        </span>
      </div>

      {/* FPS */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] text-slate-500">FPS</span>
        <span className="text-xs font-mono text-dms-accent">{fps}</span>
      </div>

      {/* Camera Health */}
      <div className="flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] text-slate-500">Camera</span>
        <span className={`text-xs font-mono ${data?.confidence.faceDetected ? 'text-dms-success' : 'text-dms-warning'}`}>
          {cameraHealth}
        </span>
      </div>

      {/* Tracking */}
      <div className="flex items-center gap-1.5">
        <Radio className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] text-slate-500">Track</span>
        <span className={`text-xs font-mono ${tracking === 'LOCKED' ? 'text-dms-success' : 'text-dms-danger'}`}>
          {tracking}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pipeline Mode */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 uppercase">Pipeline</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-dms-accent/10 text-dms-accent border border-dms-accent/30">
          {mode.toUpperCase()}
        </span>
      </div>

      {/* Connection */}
      <div className="flex items-center gap-1.5">
        {connected ? (
          <Wifi className="w-3.5 h-3.5 text-dms-success" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-dms-danger" />
        )}
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-dms-success animate-pulse' : 'bg-dms-danger'}`} />
        <span className="text-[10px] text-slate-500">
          {connected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
};
