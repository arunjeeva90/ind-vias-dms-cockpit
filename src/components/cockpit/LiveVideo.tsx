import { useEffect, useRef, useState } from 'react';

export type VideoState = 'connecting' | 'live' | 'unavailable';

export function LiveVideo({ url, onStatus }: { url: string; onStatus: (state: VideoState) => void }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<VideoState>('connecting');
  useEffect(() => { onStatus(state); }, [state, onStatus]);
  useEffect(() => {
    if (state !== 'unavailable') return;
    const timer = setTimeout(() => { setAttempt(n => n + 1); }, 2000);
    return () => clearTimeout(timer);
  }, [state, attempt]);
  // Continuous MJPEG responses may decode frames before firing a load event.
  // Inspect browser image metadata only; frames stay outside React state.
  useEffect(() => {
    const timer = setInterval(() => {
      const image = imageRef.current;
      if (image && image.naturalWidth > 0 && image.naturalHeight > 0) setState('live');
    }, 250);
    return () => clearInterval(timer);
  }, [attempt, url]);
  // A new keyed image creates a fresh browser-managed MJPEG request.
  const source = `${url}${url.includes('?') ? '&' : '?'}retry=${attempt}`;
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <img ref={imageRef} key={source} src={source} alt="Live annotated DMS camera" className={`w-full h-full object-contain ${state === 'unavailable' ? 'opacity-0' : ''}`}
        onLoad={() => setState('live')} onError={() => setState('unavailable')} />
      {state !== 'live' && <div role="status" className="absolute bottom-4 text-center text-dms-warning bg-dms-panel/90 p-4 rounded border border-dms-warning/40">
        {state === 'unavailable' ? 'Video unavailable — reconnecting…' : 'Connecting to camera…'}
      </div>}
    </div>
  );
}
