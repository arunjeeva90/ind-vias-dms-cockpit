import React, { useState } from 'react';
import { buildVicharakConfig } from '../config/vicharak';
import { useBoardHealth } from '../hooks/useBoardHealth';
import { VideoState } from './cockpit/LiveVideo';
import { useTelemetry } from '../hooks/useTelemetry';
import { StatusBar } from './cockpit/StatusBar';
import { LeftConsole } from './cockpit/LeftConsole';
import { CenterVideoPanel } from './cockpit/CenterVideoPanel';
import { RightHeadPanel } from './cockpit/RightHeadPanel';
import { BottomTimeline } from './cockpit/BottomTimeline';
import { DecisionCard } from './cockpit/DecisionCard';

export const Dashboard: React.FC = () => {
  const config = buildVicharakConfig();
  const { data, connected, mode, state, stale } = useTelemetry({ mode: config.mode, url: config.telemetryUrl });
  const [videoState, setVideoState] = useState<VideoState>('connecting');
  const { health, available: healthAvailable } = useBoardHealth(config.healthUrl, mode === 'websocket');
  const status = mode === 'dummy' ? 'Dummy mode' : stale ? 'Telemetry stale' : state;


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
      <div className="relative">
        <StatusBar data={data} connected={connected} mode={mode} connectionState={status} videoUnavailable={mode === 'websocket' && videoState === 'unavailable'} />
        {mode === 'websocket' && <div className="text-[10px] px-4 py-1 text-slate-400 bg-dms-panel" aria-label="Board diagnostics">
          Health: {healthAvailable ? 'available' : 'unavailable'} · Protocol: {health?.version ?? '—'} · Video frames: {health?.videoFrameCount ?? '—'} · Telemetry frames: {health?.telemetryFrameCount ?? '—'}
          {!healthAvailable && health && ' (last health response)'}
        </div>}
        {stale && <div role="alert" className="absolute top-full left-0 right-0 z-30 bg-red-950/95 text-red-200 text-center border border-red-500 py-2 font-bold">Telemetry stale — no valid message for 2 seconds. Showing last known values.</div>}
      </div>

      {/* Main Content - 3 Column Layout */}
      {data ? (
        <div className="grid grid-cols-[280px_1fr_320px] gap-2 p-2 min-h-0 overflow-hidden" style={{ opacity: stale ? 0.4 : 1 }} data-testid="telemetry-panels">
          {/* Left Console */}
          <LeftConsole data={data} />

          {/* Center Video Panel */}
          <CenterVideoPanel data={data} live={mode === 'websocket'} videoUrl={config.videoUrl} onVideoStatus={setVideoState} />

          {/* Right Panel - Head Model + Decision Card stacked */}
          <div className="flex flex-col gap-2 min-h-0 overflow-visible">
            <div className="flex-1 min-h-0 overflow-visible">
              <RightHeadPanel data={data} />
            </div>
            <DecisionCard data={data} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[280px_1fr_320px] gap-2 p-2 min-h-0">
          <div className="text-slate-400 text-sm p-4">Waiting for valid DMS telemetry…</div>
          {mode === 'websocket' && <CenterVideoPanel data={null} live videoUrl={config.videoUrl} onVideoStatus={setVideoState} />}
          <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-dms-accent/30 border-t-dms-accent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm animate-pulse">
              Initializing DMS telemetry pipeline...
            </span>
          </div>
          </div>
        </div>
      )}

      {/* Bottom Timeline */}
      {data && (
        <div className="h-[180px] px-2 pb-2" style={{ opacity: stale ? 0.4 : 1 }}>
          <BottomTimeline data={data} />
        </div>
      )}
    </div>
  );
};
