import React from 'react';
import { DriverState } from '../types/dms';
import { Eye, AlertTriangle, Phone, Moon, Activity } from 'lucide-react';

interface DriverStatePanelProps {
  state: DriverState;
}

function getStateConfig(state: DriverState) {
  switch (state) {
    case DriverState.ATTENTIVE:
      return {
        label: 'Attentive',
        color: 'text-dms-success',
        bgGlow: 'shadow-dms-success/20',
        bgColor: 'bg-dms-success/10',
        borderColor: 'border-dms-success/30',
        Icon: Eye,
      };
    case DriverState.DROWSY:
      return {
        label: 'Drowsy',
        color: 'text-yellow-400',
        bgGlow: 'shadow-yellow-400/20',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400/30',
        Icon: Moon,
      };
    case DriverState.DISTRACTED:
      return {
        label: 'Distracted',
        color: 'text-dms-warning',
        bgGlow: 'shadow-dms-warning/20',
        bgColor: 'bg-dms-warning/10',
        borderColor: 'border-dms-warning/30',
        Icon: AlertTriangle,
      };
    case DriverState.FATIGUED:
      return {
        label: 'Fatigued',
        color: 'text-dms-danger',
        bgGlow: 'shadow-dms-danger/20',
        bgColor: 'bg-dms-danger/10',
        borderColor: 'border-dms-danger/30',
        Icon: Activity,
      };
    case DriverState.PHONE_USE:
      return {
        label: 'Phone Use',
        color: 'text-dms-danger',
        bgGlow: 'shadow-dms-danger/20',
        bgColor: 'bg-dms-danger/10',
        borderColor: 'border-dms-danger/30',
        Icon: Phone,
      };
  }
}

export const DriverStatePanel: React.FC<DriverStatePanelProps> = ({ state }) => {
  const config = getStateConfig(state);
  const { Icon } = config;

  return (
    <div
      className={`bg-dms-panel rounded-xl border ${config.borderColor} p-6 flex flex-col items-center justify-center h-full shadow-lg ${config.bgGlow}`}
    >
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Driver State
      </h3>
      <div
        className={`w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center mb-4 transition-all duration-500`}
      >
        <Icon className={`w-10 h-10 ${config.color} transition-colors duration-500`} />
      </div>
      <p className={`text-2xl font-bold ${config.color} transition-colors duration-500`}>
        {config.label}
      </p>
    </div>
  );
};
