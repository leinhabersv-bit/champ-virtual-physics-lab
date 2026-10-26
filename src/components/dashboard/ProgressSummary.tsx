import React from 'react';
import { EXPERIMENTS_DATA } from '../../data/experiments';
import { CheckCircle, Award, BookCheck, ShieldCheck } from 'lucide-react';

interface ProgressSummaryProps {
  completedExptIds: string[];
  vivaScores: Record<string, number>;
  onLaunchDemo: () => void;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  completedExptIds,
  vivaScores,
  onLaunchDemo,
}) => {
  const total = EXPERIMENTS_DATA.length; // 9 experiments
  const cycle1Total = EXPERIMENTS_DATA.filter(e => e.cycle === 1).length; // 4
  const cycle2Total = EXPERIMENTS_DATA.filter(e => e.cycle === 2).length; // 5
  const completedCount = completedExptIds.length;

  const totalVivaMarks = Object.values(vivaScores).reduce((acc, curr) => acc + curr, 0);
  const maxPossibleViva = total * 3; // 27 marks

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-400 tracking-wider uppercase">
            BAPHY105 • Continuous Assessment Tracker
          </span>
          <h2 className="text-lg font-bold text-slate-100 mt-0.5">
            Student Laboratory Progress &amp; Audit Status
          </h2>
        </div>

        <button
          type="button"
          onClick={onLaunchDemo}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          Launch Experiment 1 Live Demo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <BookCheck className="w-4 h-4 text-indigo-400" />
            <span>Cycle 1 (Expts 1–4)</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {cycle1Total} Modules
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">{completedCount} Demo Active • 3 Scaffolded</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <BookCheck className="w-4 h-4 text-purple-400" />
            <span>Cycle 2 (Expts 5–9)</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {cycle2Total} Modules
          </div>
          <div className="text-[10px] text-indigo-400 font-mono">5 Engines Scaffolded</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Viva Voce Accrual</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {totalVivaMarks} / {maxPossibleViva} <span className="text-xs text-slate-400">Marks</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {Object.keys(vivaScores).length} of 9 evaluated
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Manual Traceability</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            86 / 86 <span className="text-xs text-slate-400">Pages</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Expt 8 Visual Verified</div>
        </div>
      </div>
    </div>
  );
};
