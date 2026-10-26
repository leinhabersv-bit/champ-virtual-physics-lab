import React, { useState } from 'react';
import { ExperimentMode } from '../../types/experiment';
import { RotateCcw, Lightbulb, Save, Printer, HelpCircle, Compass, Award } from 'lucide-react';

interface WorkbenchToolbarProps {
  activeMode: ExperimentMode;
  onModeChange: (mode: ExperimentMode) => void;
  onReset: () => void;
  onSave: () => void;
  hints: string[];
  lastSavedTime?: string;
  onOpenViva?: () => void;
}

export const WorkbenchToolbar: React.FC<WorkbenchToolbarProps> = ({
  activeMode,
  onModeChange,
  onReset,
  onSave,
  hints,
  lastSavedTime,
  onOpenViva,
}) => {
  const [currentHintIndex, setCurrentHintIndex] = useState<number | null>(null);

  const toggleHint = () => {
    if (hints.length === 0) return;
    if (currentHintIndex === null) {
      setCurrentHintIndex(0);
    } else if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    } else {
      setCurrentHintIndex(null); // cycle closed
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-2 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onModeChange('guided')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'guided'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Guided Mode
          </button>

          <button
            type="button"
            onClick={() => onModeChange('independent')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'independent'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Independent
          </button>

          <button
            type="button"
            onClick={() => {
              onModeChange('viva');
              onOpenViva?.();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'viva'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Viva Voce (3 M)
          </button>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {hints.length > 0 && (
            <button
              type="button"
              onClick={toggleHint}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                currentHintIndex !== null
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              {currentHintIndex === null
                ? 'Hint'
                : `Hint ${currentHintIndex + 1}/${hints.length}`}
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title="Reset Apparatus"
            aria-label="Reset Apparatus"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onSave}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1"
            title="Save Run to LocalStorage"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Save
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title="Print Lab Record"
            aria-label="Print Lab Record"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tiered Hint Banner */}
      {currentHintIndex !== null && hints[currentHintIndex] && (
        <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200 flex items-start gap-2 animate-fadeIn">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-300">
              Guidance Step {currentHintIndex + 1}:{' '}
            </span>
            {hints[currentHintIndex]}
          </div>
          <button
            type="button"
            onClick={() => setCurrentHintIndex(null)}
            className="text-amber-400/80 hover:text-amber-200 text-xs px-1 font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {lastSavedTime && (
        <div className="text-[10px] text-right font-mono text-slate-500">
          Last saved: {lastSavedTime}
        </div>
      )}
    </div>
  );
};
