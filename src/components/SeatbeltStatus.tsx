import React from 'react';
import { SeatbeltStatus as SeatbeltStatusType } from '../types/dms';
import { Shield } from 'lucide-react';

interface SeatbeltStatusProps {
  seatbelt: SeatbeltStatusType;
}

export const SeatbeltStatus: React.FC<SeatbeltStatusProps> = ({ seatbelt }) => {
  const isWorn = seatbelt.worn;

  return (
    <div className="bg-dms-panel rounded-xl border border-slate-700/50 p-4 h-full">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
        Seatbelt
      </h3>
      <div className="flex flex-col items-center justify-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
            isWorn
              ? 'bg-dms-success/15 border-2 border-dms-success/40'
              : 'bg-dms-danger/15 border-2 border-dms-danger/40 animate-pulse'
          }`}
        >
          <Shield
            className={`w-8 h-8 transition-colors duration-500 ${
              isWorn ? 'text-dms-success' : 'text-dms-danger'
            }`}
          />
        </div>
        <p
          className={`mt-3 text-sm font-bold uppercase ${
            isWorn ? 'text-dms-success' : 'text-dms-danger'
          }`}
        >
          {isWorn ? 'Worn' : 'Not Worn'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Confidence: {(seatbelt.confidence * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};
