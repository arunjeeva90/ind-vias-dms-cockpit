import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { StatusBar } from './cockpit/StatusBar';
import { LeftConsole } from './cockpit/LeftConsole';
import { CenterVideoPanel } from './cockpit/CenterVideoPanel';
import { RightHeadPanel } from './cockpit/RightHeadPanel';
import { BottomTimeline } from './cockpit/BottomTimeline';
import { DecisionCard } from './cockpit/DecisionCard';

export const Dashboard: React.FC = () => {
  const { data, connected, mode } = useTelemetry({ mode: 'dummy' });

  return (
    <div className="h-screen w-screen overflow-hidden bg-dms-dark grid grid-rows-[auto_1fr_auto]">
      {/* Top Status Bar */}
      <StatusBar data={data} connected={connected} mode={mode} />

      {/* Main Content - 3 Column Layout */}
      {data ? (
        <div className="grid grid-cols-[280px_1fr_320px] gap-2 p-2 min-h-0 overflow-hidden">
          {/* Left Console */}
          <LeftConsole data={data} />

          {/* Center Video Panel */}
          <CenterVideoPanel data={data} />

          {/* Right Panel - Head Model + Decision Card stacked */}
          <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0">
              <RightHeadPanel data={data} />
            </div>
            <DecisionCard data={data} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-dms-accent/30 border-t-dms-accent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm animate-pulse">
              Initializing DMS telemetry pipeline...
            </span>
          </div>
        </div>
      )}

      {/* Bottom Timeline */}
      {data && (
        <div className="h-[180px] px-2 pb-2">
          <BottomTimeline data={data} />
        </div>
      )}
    </div>
  );
};
