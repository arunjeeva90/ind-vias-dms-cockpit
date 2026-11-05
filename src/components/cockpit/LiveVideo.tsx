import { useEffect, useState } from 'react';

export type VideoState = 'connecting' | 'live' | 'unavailable';

export function LiveVideo({ url, onStatus }: { url: string; onStatus: (state: VideoState) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<VideoState>('connecting');
  useEffect(() => { onStatus(state); }, [state, onStatus]);
  useEffect(() => {
    if (state !== 'unavailable') return;
    const timer = setTimeout(() => { setAttempt(n => n + 1); }, 2000);
    return () => clearTimeout(timer);
  }, [state, attempt]);
  // A new keyed image creates a fresh browser-managed MJPEG request.
  const source = `${url}${url.includes('?') ? '&' : '?'}retry=${attempt}`;
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <img key={source} src={source} alt="Live annotated DMS camera" className={`w-full h-full object-contain ${state === 'live' ? '' : 'opacity-0'}`}
        onLoad={() => setState('live')} onError={() => setState('unavailable')} />
      {state !== 'live' && <div role="status" className="absolute text-center text-dms-warning bg-dms-panel/90 p-4 rounded border border-dms-warning/40">
        {state === 'unavailable' ? 'Video unavailable — reconnecting…' : 'Connecting to camera…'}
      </div>}
    </div>
  );
}
