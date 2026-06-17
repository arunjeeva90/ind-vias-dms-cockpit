import React from 'react';
import { useDmsTelemetry } from '../hooks/useDmsTelemetry';
import { StatusBar } from './cockpit/StatusBar';
import { LeftConsole } from './cockpit/LeftConsole';
import { CenterVideoPanel } from './cockpit/CenterVideoPanel';
import { RightHeadPanel } from './cockpit/RightHeadPanel';
import { BottomTimeline } from './cockpit/BottomTimeline';
import { DecisionCard } from './cockpit/DecisionCard';

export const Dashboard: React.FC = () => {
  const { data, connected, mode } = useDmsTelemetry({ mode: 'DUMMY' });

  return (
    <div className="h-screen w-screen overflow-hidden bg-dms-dark grid grid-rows-[auto_1fr_auto] relative">
      {/* Circuit-trace overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cpath d='M30 0v60h90v30h-60v60h150v-90h30v120h-90v60h30v-30h90v-60h-30v-30h30v-90h-60v30h-30v-30z' fill='none' stroke='%231a1050' stroke-width='0.5'/%3E%3Ccircle cx='30' cy='60' r='2' fill='%232d1b69'/%3E%3Ccircle cx='120' cy='90' r='2' fill='%232d1b69'/%3E%3Ccircle cx='210' cy='150' r='2' fill='%232d1b69'/%3E%3Ccircle cx='150' cy='210' r='2' fill='%232d1b69'/%3E%3Ccircle cx='270' cy='90' r='2' fill='%232d1b69'/%3E%3Ccircle cx='60' cy='240' r='2' fill='%232d1b69'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
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
          <div className="flex flex-col gap-2 min-h-0 overflow-visible">
            <div className="flex-1 min-h-0 overflow-visible">
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
