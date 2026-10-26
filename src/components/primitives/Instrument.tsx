import React from 'react';
import { Gauge, Zap, Sun, Activity } from 'lucide-react';

export type InstrumentType = 'voltmeter' | 'ammeter' | 'luxmeter' | 'power' | 'generic';

interface InstrumentProps {
  type: InstrumentType;
  title: string;
  value: number | string;
  unit: string;
  subValue?: string;
  subLabel?: string;
  range?: string;
  isActive?: boolean;
}

export const Instrument: React.FC<InstrumentProps> = ({
  type,
  title,
  value,
  unit,
  subValue,
  subLabel,
  range,
  isActive = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'voltmeter':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'ammeter':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'luxmeter':
        return <Sun className="w-4 h-4 text-yellow-400" />;
      default:
        return <Gauge className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'voltmeter':
        return 'border-amber-500/30 shadow-amber-500/10';
      case 'ammeter':
        return 'border-emerald-500/30 shadow-emerald-500/10';
      case 'luxmeter':
        return 'border-yellow-500/30 shadow-yellow-500/10';
      default:
        return 'border-indigo-500/30 shadow-indigo-500/10';
    }
  };

  return (
    <div
      className={`bg-slate-900/90 border ${getBorderColor()} rounded-xl p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-600`}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            {title}
          </span>
        </div>
        {range && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {range}
          </span>
        )}
      </div>

      {/* Retro Digital LCD readout */}
      <div className="mt-2 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-baseline justify-between shadow-inner">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-mono text-2xl font-bold tracking-tight ${
              isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-slate-600'
            }`}
          >
            {value}
          </span>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-500/80 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">
          {unit}
        </span>
      </div>

      {subValue && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{subLabel}:</span>
          <span className="text-slate-200 font-semibold">{subValue}</span>
        </div>
      )}
    </div>
  );
};
