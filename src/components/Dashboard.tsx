import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { DriverState } from '../types/dms';
import { DriverStatePanel } from './DriverStatePanel';
import { HeadPoseGauge } from './HeadPoseGauge';
import { GazeVisualization } from './GazeVisualization';
import { DrowsinessIndicator } from './DrowsinessIndicator';
import { DistractionIndicator } from './DistractionIndicator';
import { SeatbeltStatus } from './SeatbeltStatus';
import { PhoneSuspicion } from './PhoneSuspicion';
import { DMSConfidence } from './DMSConfidence';
import { ADASFusionReadiness } from './ADASFusionReadiness';

function getStateBadgeColor(state?: DriverState): string {
  switch (state) {
    case DriverState.ATTENTIVE:
      return 'bg-dms-success/20 text-dms-success border-dms-success/50';
    case DriverState.DROWSY:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case DriverState.DISTRACTED:
      return 'bg-dms-warning/20 text-dms-warning border-dms-warning/50';
    case DriverState.FATIGUED:
      return 'bg-dms-danger/20 text-dms-danger border-dms-danger/50';
    case DriverState.PHONE_USE:
      return 'bg-dms-danger/20 text-dms-danger border-dms-danger/50';
    default:
      return 'bg-slate-700/20 text-slate-400 border-slate-700/50';
  }
}

export const Dashboard: React.FC = () => {
  const { data, connected } = useTelemetry({ mode: 'dummy' });

  return (
    <div className="min-h-screen bg-dms-dark p-3 lg:p-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between mb-4 px-2">
        <h1 className="text-xl lg:text-2xl font-bold text-dms-accent tracking-wide">
          IND-VIAS DualSight DMS Cockpit
        </h1>
        <div className="flex items-center gap-4">
          {data && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStateBadgeColor(
                data.driverState
              )}`}
            >
              {data.driverState.replace('_', ' ')}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? 'bg-dms-success animate-pulse' : 'bg-dms-danger'
              }`}
            />
            <span className="text-xs text-slate-400">
              {connected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      {data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {/* Driver State - spans 2 cols on larger screens */}
          <div className="md:col-span-2 lg:col-span-1">
            <DriverStatePanel state={data.driverState} />
          </div>

          {/* Head Pose */}
          <div>
            <HeadPoseGauge headPose={data.headPose} />
          </div>

          {/* Gaze Visualization */}
          <div>
            <GazeVisualization gaze={data.gaze} />
          </div>

          {/* Drowsiness */}
          <div>
            <DrowsinessIndicator drowsiness={data.drowsiness} />
          </div>

          {/* Distraction */}
          <div>
            <DistractionIndicator distraction={data.distraction} />
          </div>

          {/* Seatbelt */}
          <div>
            <SeatbeltStatus seatbelt={data.seatbelt} />
          </div>

          {/* Phone Suspicion */}
          <div>
            <PhoneSuspicion phoneSuspicion={data.phoneSuspicion} />
          </div>

          {/* DMS Confidence */}
          <div>
            <DMSConfidence confidence={data.confidence} />
          </div>

          {/* ADAS Fusion */}
          <div className="md:col-span-2 lg:col-span-1">
            <ADASFusionReadiness adasFusion={data.adasFusion} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 text-lg animate-pulse">
            Initializing telemetry...
          </div>
        </div>
      )}
    </div>
  );
};
