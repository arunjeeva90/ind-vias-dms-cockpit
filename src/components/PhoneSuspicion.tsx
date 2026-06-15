import React from 'react';
import { PhoneSuspicion as PhoneSuspicionType } from '../types/dms';
import { Phone } from 'lucide-react';

interface PhoneSuspicionProps {
  phoneSuspicion: PhoneSuspicionType;
}

export const PhoneSuspicion: React.FC<PhoneSuspicionProps> = ({ phoneSuspicion }) => {
  const detected = phoneSuspicion.detected;

  return (
    <div
      className={`bg-dms-panel rounded-xl border p-4 h-full transition-all duration-300 ${
        detected
          ? 'border-dms-danger/50 shadow-lg shadow-dms-danger/10'
          : 'border-slate-700/50'
      }`}
    >
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        Phone Detection
      </h3>
      <div className="flex flex-col items-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            detected
              ? 'bg-dms-danger/20 border-2 border-dms-danger/50 animate-pulse'
              : 'bg-slate-800 border-2 border-slate-700'
          }`}
        >
          <Phone
            className={`w-7 h-7 transition-colors duration-300 ${
              detected ? 'text-dms-danger' : 'text-slate-500'
            }`}
          />
        </div>
        <p
          className={`mt-2 text-xs font-bold uppercase ${
            detected ? 'text-dms-danger' : 'text-slate-500'
          }`}
        >
          {detected ? 'Detected' : 'Not Detected'}
        </p>

        {/* Confidence bar */}
        <div className="w-full mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">Confidence</span>
            <span className="text-[10px] text-slate-300 font-mono">
              {phoneSuspicion.confidence.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                detected ? 'bg-dms-danger' : 'bg-slate-600'
              }`}
              style={{ width: `${Math.min(phoneSuspicion.confidence, 100)}%` }}
            />
          </div>
        </div>

        {/* Hand position */}
        <p className="text-[10px] text-slate-400 mt-2">
          Hand: <span className="text-slate-300">{phoneSuspicion.handPosition.replace(/_/g, ' ')}</span>
        </p>
      </div>
    </div>
  );
};
