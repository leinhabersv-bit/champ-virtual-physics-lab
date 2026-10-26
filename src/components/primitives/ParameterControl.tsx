import React from 'react';
import { Sliders, Minus, Plus } from 'lucide-react';

interface ParameterControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  discreteOptions?: Array<{ label: string; value: number }>;
  description?: string;
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  discreteOptions,
  description,
}) => {
  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(4)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Number((value + step).toFixed(4)));
    onChange(next);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          {label}
        </label>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm font-bold text-indigo-300">
            {value}
          </span>
          <span className="text-xs text-slate-400 font-mono">{unit}</span>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-slate-400 leading-tight">{description}</p>
      )}

      {/* Discrete decade selector buttons if provided */}
      {discreteOptions && discreteOptions.length > 0 ? (
        <div className="grid grid-cols-4 gap-1 pt-1">
          {discreteOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-1.5 py-1 text-[11px] font-mono rounded font-medium transition-all ${
                Math.abs(value - opt.value) < 1e-4
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        /* Continuous Slider with Step Steppers */
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= min}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="w-3 h-3" />
          </button>

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            aria-label={`${label} slider`}
          />

          <button
            type="button"
            onClick={handleIncrement}
            disabled={value >= max}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Increase ${label}`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
